import json
import time
import pathlib
# from jsonschema import validate

# import setproctitle
from enum import StrEnum
from datetime import datetime

from picamera2 import Picamera2
from picamera2.encoders import H264Encoder
from picamera2.outputs import FileOutput

ROOT_DIRECTORY = pathlib.Path(__file__).resolve().parent


class TimeUnit(StrEnum):
    SECOND = "s"
    MINUTE = "m"
    HOUR = "h"
    DAY = "d"


class Camera:
    _config: dict

    _width: int
    _height: int
    _framerate: int
    _bitrate: int

    _recording_time: int
    _rest_time: int
    _time_unit: TimeUnit
    _output_dir: str

    def __init__(self, config_path: str = "config/config.json"):
        # bit rate data
        # 33554432 (33MB)- 30MB per 10s video
        # 16777216 (16MB)- 20MB per 10s video
        #  8388608 ( 8MB)- 10MB per 10s video

        self.picam = Picamera2()
        self._validate_and_set_config(ROOT_DIRECTORY / config_path)
        pass

    def setup(self):
        video_config = self.picam.create_video_configuration(
            main={"size": (self._height, self._width)},
            controls={"FrameRate": self._framerate},
        )
        self.picam.configure(video_config)
        self.encoder = H264Encoder(bitrate=self._bitrate, framerate=self._framerate)

        self.file_output = FileOutput()
        self.encoder.output = [self.file_output]

    def run(self):
        # loop forever
        if self._config["mode"] == "picture":
            self.picam.start()
            while True:
                # Capture the image and save to a file
                output_file = self._get_file_name()
                self.picam.capture_file(output_file)
                print(f"Picture taken, storing in ({output_file}")
                print(f"Resting...({self._rest_time})")
                time.sleep(self._rest_time)

        elif self._config["mode"] == "video":
            self.picam.start_encoder(self.encoder)
            self.picam.start()
            while True:
                output_file = self._get_file_name()
                self.file_output.fileoutput = output_file
                # start video
                # self.file_output.start()
                print(f"Recording started ({self._recording_time}s)")
                # sleep is needed for it to continue recording
                time.sleep(self._recording_time)

                # once time is finished, stop recording
                print(f"Recording Finished and stored ({output_file}")
                # self.file_output.stop()

                print(f"Resting...({self._rest_time})")
                time.sleep(self._rest_time)

    def _validate_and_set_config(self, path: str):
        # TODO: add error handling if file doesnt exist
        self._config = json.loads(open(path, "r").read())
        # config_schema = json.loads(
        # open(ROOT_DIRECTORY / "config/config_schema.json", "r").read()
        # )
        # validate(self._config, config_schema)
        camera_config: dict = self._config["camera"]

        # unit used to define video recording time, default is minutes (m)
        self._set_time_unit_conversion(camera_config.get("unit_time", TimeUnit.MINUTE))

        # how long should each video be, default is 10
        self._recording_time = camera_config.get("recording_time", 10) * self._mutiplier

        # how many frames per second, default 24
        self._framerate = camera_config.get("framerate", 24)

        # rest time defines how much time to wait till next video starts being saved, default is 0
        # this means, once a video is finished being recorded, the next one will start being recorded
        # immediately
        self._rest_time = camera_config.get("rest_time", 0) * self._mutiplier

        # bitrate is used to determine the quality of image during compression. The higher the value the
        # better quality image, the more space it takes. Input is expected to be provided as MB. Meaning
        # if you want 16MB birate, bitrate value should be 16. Default is 8MB
        self._bitrate = camera_config.get("bitrate", 8) * 2**20

        # how many width pixels, think of it as if you were providing measurements for a box ( width x height )
        # the bigger width x height, the better the image, the more storage it takes. Default is 1920
        self._width = camera_config.get("resolution", {}).get("width", 1920)
        # how many height pixels, default is 1080
        self._height = camera_config.get("resolution", {}).get("height", 1080)

        # location of where the rapsberry pi will be located in, not default value
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
                self._mutiplier = 1
                # do nothing
                pass
            case TimeUnit.MINUTE:
                # Theres 60 seconds in a method
                self._mutiplier = 60
                pass
            case TimeUnit.HOUR:
                # in 60 minutes in an hour, each minute has 60 seconds = 60 * 60
                self._mutiplier = 3600
                pass
            case TimeUnit.DAY:
                # 24 hours a day, 60 minutes in an hour, each minute has 60 seconds = 24 * 60 * 60
                self._mutiplier = 86400

    def _get_file_name(self) -> str:
        """Defines the name of the file generated for the video."""

        # the timestamp format here aims to do: dd_mm_yyyy_hh_mm
        # Example: Say its Feb 20 2025, 6:03:10AM. The format would look like: 20_02_2025_06_03_10
        timestamp = datetime.now().strftime("%d_%m_%Y_%H_%M_%S")

        # The complete filename however would look like:
        # 1_sj_pr_usa_20_02_2025_06_03_10.h264
        # Assuming _pi_id = 1, _location = sj_pr_usa
        file_name = f"{self._pi_id}_{self._location}_{timestamp}.h264"
        return f"{ROOT_DIRECTORY}{self._output_dir}{file_name}"
