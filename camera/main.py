import json
import time
import os
import pathlib
import subprocess
from enum import StrEnum
from datetime import datetime

from picamera2 import Picamera2, Preview
from picamera2.encoders import H264Encoder


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

    def __init__(self, config_path: str = "config.json"):
        # bit rate data
        # 33554432 (33MB)- 30MB per 10s video
        # 16777216 (16MB)- 20MB per 10s video
        #  8388608 ( 8MB)- 10MB per 10s video

        self.picam = Picamera2()
        self._validate_and_set_config(ROOT_DIRECTORY / config_path)
        pass
        
    def setup(self):
        video_config = self.picam.create_video_configuration(main={"size": (self._height, self._width)})
        self.picam.configure(video_config)
        self.encoder = H264Encoder(bitrate=self._bitrate)

    def run(self):

        # loop forever
        while(True):
            output_file = self._get_file_name()

            self.picam.start()
            # start video
            self.picam.start_recording(self.encoder, output_file)
            print(f"Recording started ({self._recording_time}s)")
            # sleep is needed for it to continue recording
            time.sleep(self._recording_time)

            # once time is finished, stop recording
            print(f"Recording Finished and stored ({output_file.split('/')[-1]})")
            self.picam.stop_recording()

            print(f"Resting...({self._rest_time})")
            time.sleep(self._rest_time)



    def _validate_and_set_config(self, path: str):
        self._config = json.loads(open(path, "r").read())
        camera_config = self._config["camera"]

        # TODO: add code to validate here
        self._set_time_unit_conversion(camera_config["unit_time"])

        # TODO: validation, recording time cannot be less than 5 seconds
        self._recording_time = camera_config["recording_time"] * self._mutiplier
        
        self._framerate = camera_config["framerate"]

        # TODO: validation, recording time cannot be less than 5 seconds
        self._rest_time = camera_config["rest_time"] * self._mutiplier
        self._bitrate = camera_config["bitrate"]
        self._width = camera_config["resolution"]["width"]
        self._height = camera_config["resolution"]["height"]
        self._location = camera_config["location"]
        self._pi_id = camera_config["pi_id"]

        # TODO: if directory does not exist, create it
        self._output_dir = camera_config["output_dir"]

    def _set_time_unit_conversion(self, unit: TimeUnit):
        match unit:
            case TimeUnit.SECOND:
                self._mutiplier = 1
                # do nothing
                pass
            case TimeUnit.MINUTE:
                self._mutiplier = 60
                pass
            case TimeUnit.HOUR:
                self._mutiplier = 3600
                pass
            case TimeUnit.DAY:
                self._mutiplier = 86300

    def _get_file_name(self) -> pathlib.Path:
        # the timestamp format here aims to do: dd_mm_yyyy_hh_mm
        # Example: Say its Feb 20 2025, 6:03:10AM. The format would look like: 20_02_2025_06_03_10
        timestamp = datetime.now().strftime("%d_%m_%Y_%H_%M_%S")
        
        # The complete filename however would look like:
        # 1_sj_pr_usa_25_02_2025_01_00_10.h264
        # Assuming _pi_id = 1, _location = sj_pr_usa
        return str(ROOT_DIRECTORY / self._output_dir / f"{self._pi_id}_{self._location}_{timestamp}.h264")


if __name__ == "__main__":
    camera = Camera("config.json")
    camera.setup()
    camera.run()
