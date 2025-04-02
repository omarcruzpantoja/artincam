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
    _images_per_cycle: int

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
        video_config = self.picam.create_video_configuration(
            main={"size": (self._height, self._width)},
            controls={"FrameDurationLimits": (frame_duration, frame_duration)},
        )
        self.picam.configure(video_config)
        self.encoder = H264Encoder(bitrate=self._bitrate, framerate=self._framerate, enable_sps_framerate=True)
        self.ffmpeg_output = FfmpegOutput("")
        self.encoder.output = [self.ffmpeg_output]

    def run(self):
        # loop forever
        self.picam.start()
        match self._mode:
            case "image":
                while True:
                    self._capture_image()

            case "video":
                while True:
                    self._capture_video()

            case "image/video":
                while True:
                    for _ in range(self._images_per_cycle):
                        self._capture_image()
                    self._capture_video()

    def _capture_image(self):
        # Capture the image and save to a file
        output_file = self._get_file_name(image=True)
        self.picam.capture_file(output_file)
        self.file_counter.increment_counter()
        logger.debug(f"Image taken, storing in ({output_file})\nImage Resting...({self._image_rest_time})")
        self._sleep(self._image_rest_time)

    def _capture_video(self):
        output_file = self._get_file_name()
        self.ffmpeg_output.output_filename = output_file
        logger.debug(f"Starting Recording ({self._recording_time}s)")
        self.picam.start_encoder(self.encoder)
        # sleep is needed for it to continue recording
        self._sleep(self._recording_time)
        # once time is finished, stop recording
        self.picam.stop_encoder()
        self.file_counter.increment_counter()
        logger.debug(f"Recording Finished and stored ({output_file})\nCycle Resting...({self._cycle_rest_time})")
        self._sleep(self._cycle_rest_time)

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

    def _get_file_name(self, image=False) -> str:
        """Defines the name of the file generated for the video."""

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
        file_name = f"{self._pi_id}_{self._location}_{timestamp}_{str(self._pi_id).zfill(4)}.{file_stride}"
        return str(self._output_path / file_name)

    def _sleep(self, seconds: float):
        if seconds > 0:
            time.sleep(seconds)
