import json
import logging
import os
import pathlib
import shutil
import time
from datetime import datetime
from enum import StrEnum

import cv2
import psutil
from libcamera import Transform
from picamera2 import Picamera2, MappedArray
from picamera2.encoders import H264Encoder
from picamera2.outputs import FfmpegOutput, PyavOutput

from .logger import logger

ROOT_DIRECTORY = pathlib.Path(__file__).resolve().parent
logger.setLevel(logging.DEBUG)
one_GB = 2**30


class TimeUnit(StrEnum):
    SECOND = "s"
    MINUTE = "m"
    HOUR = "h"
    DAY = "d"


class FileCounter:
    COUNTER_FILE_PATH = ROOT_DIRECTORY / "config/counter.txt"

    counter: int

    def __init__(self):
        self._init_counter()

    def _init_counter(self):
        """Reads the counter value from the file. If the file doesn't exist, returns 0."""
        if not self.COUNTER_FILE_PATH.exists():
            self.counter = 0

        with open(self.COUNTER_FILE_PATH, "r") as file:
            try:
                self.counter = int(file.read().strip())
            except ValueError:
                self.counter = 0

    def increment_counter(self):
        """Increments the counter and updates the file."""
        self.counter += 1
        with open(self.COUNTER_FILE_PATH, "w") as file:
            file.write(str(self.counter))


class Camera:
    _config: dict
    _mode: str

    _width: int
    _height: int
    _framerate: int
    _bitrate: int

    _image_rest_time: int
    _image_capture_time: int

    _recording_time: int
    _cycle_rest_time: int
    _time_unit: TimeUnit
    _output_path: pathlib.Path

    picam: Picamera2
    encoder: H264Encoder
    ffmpeg_output: FfmpegOutput
    file_counter: FileCounter

    def __init__(self, config_path: str = "config/config.json"):
        # bit rate data
        # 33554432 (33MB)- 30MB per 10s video
        # 16777216 (16MB)- 20MB per 10s video
        #  8388608 ( 8MB)- 10MB per 10s video

        # Recommended 8MB bitrate

        # Resolution
        # 1640 x 1232
        # Note: 1920x1080 cannot be used, it limits the FoV of the camera. Not good.
        self.picam = Picamera2()
        self.file_counter = FileCounter()
        self._validate_and_set_config(ROOT_DIRECTORY / config_path)

    def setup(self):
        frame_duration = 1000000 // self._framerate
        config_dict = {
            "main": {"size": (self._width, self._height)},
            "controls": {"FrameDurationLimits": (frame_duration, frame_duration)},
        }

        if self._horizontal_flip:
            config_dict["transform"] = Transform(hflip=1)
        if self._vertical_flip:
            config_dict["transform"] = Transform(vflip=1)

        video_config = self.picam.create_video_configuration(**config_dict)
        self.picam.configure(video_config)
        self.encoder = H264Encoder(bitrate=self._bitrate, framerate=self._framerate, enable_sps_framerate=True)
        self.ffmpeg_output = FfmpegOutput("")
        self.encoder.output = [self.ffmpeg_output]

    def run(self):
        # loop forever
        try:
            self.picam.start()
            self._use_timestamp_overlay()
            time.sleep(2)  # let the camera start running properly
            match self._mode:
                case "image":
                    while True:
                        self._capture_image()

                case "video":
                    while True:
                        self._capture_video()

                case "image/video":
                    while True:
                        start_time = time.time()
                        while time.time() - start_time < self._image_capture_time:
                            self._capture_image()
                        self._capture_video()

                case "rtsp_stream":
                    self._capture_stream()
        except Exception:
            self.picam.stop_encoder()
            self.picam.stop()
            self.picam.close()
            raise

    # ----- OVERLAYS -----
    def _use_timestamp_overlay(self):
        text_color = (255, 255, 255)  # color - white
        bg_color = (0, 0, 0)  # color - black
        padding = 5
        font = cv2.FONT_HERSHEY_SIMPLEX
        scale = 1
        thickness = 2

        x_axis_location = self._width - 400
        y_axis_location = self._height - 50
        origin = (x_axis_location, y_axis_location)

        (text_width, text_height), _ = cv2.getTextSize(time.strftime("%Y-%m-%d %X"), font, scale, thickness)

        top_left = (x_axis_location - padding, y_axis_location - text_height - padding)
        bottom_right = (x_axis_location + text_width + padding, y_axis_location + padding)

        def apply_timestamp(request):
            with MappedArray(request, "main") as m:
                image = m.array
                cv2.rectangle(image, top_left, bottom_right, bg_color, cv2.FILLED)
                cv2.putText(image, time.strftime("%Y-%m-%d %X"), origin, font, scale, text_color, thickness)

        self.picam.pre_callback = apply_timestamp

    # ----- MODE HANDLERS -----
    def _capture_image(self):
        # Capture the image and save to a file
        output_file = self._get_file_name(image=True)
        self._current_time = time.strftime("%Y-%m-%d %X")
        self.picam.capture_file(output_file)
        self.file_counter.increment_counter()
        logger.debug(f"Image taken, storing in ({output_file})\nImage Resting...({self._image_rest_time})")
        self._sleep(self._image_rest_time)

    def _capture_video(self):
        output_file = self._get_file_name()
        self.ffmpeg_output.output_filename = output_file
        logger.debug(f"Starting Recording ({self._recording_time}s)")
        self.picam.start_encoder(self.encoder)

        # record for however many seconds. On each second update timestamp
        for _ in range(self._recording_time):
            self._sleep(1)
            self._current_time = time.strftime("%Y-%m-%d %X")

        # once time is finished, stop recording
        self.picam.stop_encoder()
        self.file_counter.increment_counter()
        logger.debug(f"Recording Finished and stored ({output_file})\nCycle Resting...({self._cycle_rest_time})")
        self._sleep(self._cycle_rest_time)

    def _capture_stream(self):
        rtsp_stream_output = PyavOutput(self._camera_config["rtsp_stream"]["address"], format="rtsp")
        self.encoder.output = [rtsp_stream_output]
        self.picam.start_encoder(self.encoder)

        while True:
            self._sleep(1)
            self._current_time = time.strftime("%Y-%m-%d %X")

    # ----- VALIDATORS AND CONFIG -----
    def _validate_and_set_config(self, path: str):
        self._config = json.loads(open(path, "r").read())
        camera_config: dict = self._config["camera"]
        self._camera_config = camera_config
        transforms = camera_config.get("transforms", {})

        self._mode = camera_config["mode"]
        # unit used to define video recording time, default is minutes (m)
        image_capture_time_unit = self._set_time_unit_conversion(
            camera_config.get("image_capture_time_unit", TimeUnit.MINUTE)
        )
        image_rest_time_unit = self._set_time_unit_conversion(
            camera_config.get("image_rest_time_unit", TimeUnit.MINUTE)
        )
        recording_time_unit = self._set_time_unit_conversion(camera_config.get("recording_time_unit", TimeUnit.MINUTE))
        cycle_rest_time_unit = self._set_time_unit_conversion(
            camera_config.get("cycle_rest_time_unit", TimeUnit.MINUTE)
        )

        # ----- STREAM SETUP -----
        self._vertical_flip = transforms.get("vertical_flip", False)
        self._horizontal_flip = transforms.get("horizontal_flip", False)

        # ----- IMAGE SETUP -----
        # how many images to be taken per cycle (only used in image/video mode)
        self._image_capture_time = camera_config.get("image_capture_time") * image_capture_time_unit
        # wait time between images
        self._image_rest_time = camera_config.get("image_rest_time") * image_rest_time_unit

        # ----- VIDEO SETUP -----
        # how long should each video be, default is 10
        self._recording_time = camera_config.get("recording_time", 10) * recording_time_unit

        # rest time defines how much time to wait till next video starts being saved, default is 0
        # this means, once a video is finished being recorded, the next one will start being recorded
        # immediately
        self._cycle_rest_time = camera_config.get("cycle_rest_time", 0) * cycle_rest_time_unit

        # how many frames per second, default 24
        self._framerate = camera_config.get("framerate", 24)

        # bitrate is used to determine the quality of image during compression. The higher the value the
        # better quality image, the more space it takes
        self._bitrate = camera_config.get("bitrate", 8388608)

        # how many width pixels, think of it as if you were providing measurements for a box ( width x height )
        # the bigger width x height, the better the image, the more storage it takes. Default is 1640
        self._width = camera_config.get("resolution", {}).get("width", 1640)
        # how many height pixels, default is 1232
        self._height = camera_config.get("resolution", {}).get("height", 1232)

        # location of where the rapsberry pi will be located in, no default value, must only have hyphens and lower
        # case letters with a max of 30 characters
        self._location = camera_config["location"]

        # identifier of raspberry pi, no default value
        self._pi_id = camera_config["pi_id"]

        # where to store recordings
        self._output_path = pathlib.Path(f"{ROOT_DIRECTORY}/{camera_config['output_dir']}")
        self._output_path.mkdir(parents=True, exist_ok=True)

    def _set_time_unit_conversion(self, unit: TimeUnit):
        """Depending on the file config's time unit, define the multiplier to convert whatever unit
        provided to seconds.
        """
        match unit:
            case TimeUnit.SECOND:
                return 1
                # do nothing
                pass
            case TimeUnit.MINUTE:
                # Theres 60 seconds in a method
                return 60
            case TimeUnit.HOUR:
                # in 60 minutes in an hour, each minute has 60 seconds = 60 * 60
                return 3600
            case TimeUnit.DAY:
                # 24 hours a day, 60 minutes in an hour, each minute has 60 seconds = 24 * 60 * 60
                return 86400

    # ----- UTILS -----
    def _get_file_name(self, image=False) -> str:
        """Defines the name of the file generated for the video."""

        # Automatically add data to usb stick if it can be found, otherwise save in the local disk
        usb_mount_point = self._find_usb_mount_points()
        if usb_mount_point and shutil.disk_usage(usb_mount_point).free > one_GB:
            final_transfer_path = pathlib.Path(usb_mount_point + "/data/" + str(self._pi_id) + "/")
        else:
            final_transfer_path = self._output_path

        final_transfer_path.mkdir(parents=True, exist_ok=True)

        # the timestamp format here aims to do: dd_mm_yyyy_hh_mm
        # Example: Say its Feb 20 2025, 6:03:10AM. The format would look like: 20-02-2025-06-03-10
        timestamp = datetime.now().strftime("%d-%m-%Y-%H-%M-%S")

        # The complete filename however would look like:
        # 1_sj-pr-usa-20-02-2025-06-03-10_UUIDV6.mkv
        # Assuming _pi_id = 1, _location = sj-pr-usa
        file_stride = "jpg" if image else "mkv"
        file_name = "{pi_id}_{location}_{timestamp}_{unique_id}.{file_stride}".format(
            pi_id=self._pi_id,
            location=self._location,
            timestamp=timestamp,
            unique_id=f"{str(self._pi_id).zfill(4)}-{str(self.file_counter.counter).zfill(10)}",
            file_stride=file_stride,
        )

        return str(final_transfer_path / file_name)

    def _find_usb_mount_points(self):
        """
        Lists mounted filesystems that appear to be USB storage devices.
        """
        try:
            partitions = psutil.disk_partitions(all=False)
        except Exception:
            return None

        for p in partitions:
            if p.device.startswith("/dev/sd") and p.mountpoint and os.path.exists(p.mountpoint):
                return p.mountpoint

    def _sleep(self, seconds: float):
        if seconds > 0:
            time.sleep(seconds)
