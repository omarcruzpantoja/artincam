import json
import logging
import pathlib
import time

from enum import StrEnum
from datetime import datetime

from picamera2 import Picamera2
from picamera2.encoders import H264Encoder
from picamera2.outputs import FfmpegOutput
from .logger import logger

ROOT_DIRECTORY = pathlib.Path(__file__).resolve().parent
logger.setLevel(logging.DEBUG)


class TimeUnit(StrEnum):
    SECOND = "s"
    MINUTE = "m"
    HOUR = "h"
    DAY = "d"


class Camera:
    _config: dict
    _mode: str

    _width: int
    _height: int
    _framerate: int
    _bitrate: int

    _image_rest_time: int
    _images_per_cycle: int

    _recording_time: int
    _cycle_rest_time: int
    _time_unit: TimeUnit
    _output_dir: str

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
        self._validate_and_set_config(ROOT_DIRECTORY / config_path)

    def setup(self):
        video_config = self.picam.create_video_configuration(
            main={"size": (self._height, self._width)},
            controls={"FrameRate": self._framerate},
        )
        self.picam.configure(video_config)
        self.encoder = H264Encoder(bitrate=self._bitrate, framerate=self._framerate)

        self.ffmpeg_output = FfmpegOutput()
        self.encoder.output = [self.ffmpeg_output]

    def run(self):
        # loop forever
        self.picam.start()
        match self._mode:
            case "image":
                while True:
                    self._capture_image()

            case "video":
                self.picam.start_encoder(self.encoder)

                while True:
                    self._capture_video()

            case "image/video":
                self.picam.start_encoder(self.encoder)

                while True:
                    for _ in range(self._images_per_cycle):
                        self._capture_image()
                    self._capture_video()

    def _capture_image(self):
        # Capture the image and save to a file
        output_file = self._get_file_name(image=True)
        self.picam.capture_file(output_file)
        logger.debug(f"Image taken, storing in ({output_file})")
        logger.debug(f"Image Resting...({self._image_rest_time})")
        time.sleep(self._image_rest_time)

    def _capture_video(self):
        output_file = self._get_file_name()
        self.ffmpeg_output.output_filename = output_file

        # start video
        logger.debug(f"Recording started ({self._recording_time}s)")
        # sleep is needed for it to continue recording
        time.sleep(self._recording_time)

        # once time is finished, stop recording
        logger.debug(f"Recording Finished and stored ({output_file})")
        logger.debug(f"Cycle Resting...({self._cycle_rest_time})")
        time.sleep(self._cycle_rest_time)
        # TODO: convert video from h264 to mkv. try to use ffmpeg command as part of the
        # file generated so that we dont need to delete a file? or maybe this does it automatically
        # command used that worked
        # ffmpeg -i (FILENAME) -c:v copy -c:a copy -map_metadata 0 (FILEOUT.mkv)

    def _validate_and_set_config(self, path: str):
        self._config = json.loads(open(path, "r").read())
        camera_config: dict = self._config["camera"]

        self._mode = camera_config["mode"]
        # unit used to define video recording time, default is minutes (m)
        unit_time_multiplier = self._set_time_unit_conversion(camera_config.get("unit_time", TimeUnit.MINUTE))
        image_unit_mult = self._set_time_unit_conversion(camera_config.get("image_time_unit", TimeUnit.MINUTE))

        # ----- IMAGE SETUP -----
        # how many images to be taken per cycle (only used in image/video mode)
        self._images_per_cycle = camera_config.get("images_per_cycle")
        # wait time between images
        self._image_rest_time = camera_config.get("image_rest_time") * image_unit_mult

        # ----- VIDEO SETUP -----
        # how long should each video be, default is 10
        self._recording_time = camera_config.get("recording_time", 10) * unit_time_multiplier

        # how many frames per second, default 24
        self._framerate = camera_config.get("framerate", 24)

        # rest time defines how much time to wait till next video starts being saved, default is 0
        # this means, once a video is finished being recorded, the next one will start being recorded
        # immediately
        self._cycle_rest_time = camera_config.get("cycle_rest_time", 0) * unit_time_multiplier

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
        # TODO: if directory does not exist, create it
        self._output_dir = camera_config["output_dir"]

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

    def _get_file_name(self, image=False) -> str:
        """Defines the name of the file generated for the video."""

        # the timestamp format here aims to do: dd_mm_yyyy_hh_mm
        # Example: Say its Feb 20 2025, 6:03:10AM. The format would look like: 20_02_2025_06_03_10
        timestamp = datetime.now().strftime("%d_%m_%Y_%H_%M_%S")

        # The complete filename however would look like:
        # 1_sj_pr_usa_20_02_2025_06_03_10.h264
        # Assuming _pi_id = 1, _location = sj_pr_usa
        file_stride = "jpg" if image else "mkv"
        file_name = f"{self._pi_id}_{self._location}_{timestamp}.{file_stride}"
        # TODO use pathlib and ensure output dir exists
        return f"{ROOT_DIRECTORY}/{self._output_dir}/{file_name}"
