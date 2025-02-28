import json
import time
import os
import pathlib
# import setproctitle
from enum import StrEnum
from datetime import datetime

from picamera2 import Picamera2
from picamera2.encoders import H264Encoder
from picamera2.outputs import FileOutput, FfmpegOutput


ROOT_DIRECTORY = pathlib.Path(__file__).resolve().parent
PID_STORE = "/tmp/articam.txt" #  TODO: make this shareable between scripts

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
        video_config = self.picam.create_video_configuration(
            main={"size": (self._height, self._width)},
            controls={'FrameRate': self._framerate}
        )
        self.picam.configure(video_config)
        self.encoder = H264Encoder(bitrate=self._bitrate, framerate=self._framerate)

        self.file_output = FileOutput()
        self.rtsp_stream_output = FfmpegOutput(
            "-f rtsp -rtsp_transport udp rtsp://omarcam:123cam@localhost:8554/camstream",
            audio=False
        )

        self.encoder.output = [self.file_output, self.rtsp_stream_output]

    def run(self):
        

        # loop forever
        self.picam.start_encoder(self.encoder)
        self.picam.start()
        try:
            while(True):
                output_file = self._get_file_name()
                self.file_output.fileoutput = output_file
                # start video
                self.file_output.start()
                print(f"Recording started ({self._recording_time}s)")
                # sleep is needed for it to continue recording
                time.sleep(self._recording_time)

                # once time is finished, stop recording
                print(f"Recording Finished and stored ({output_file}")
                self.file_output.stop()

                print(f"Resting...({self._rest_time})")
                time.sleep(self._rest_time)

        except:
            self.picam.stop()

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

def add_process_id():
    with open(PID_STORE, 'w') as f:
        f.write(str(os.getpid()))

        f.close()

if __name__ == "__main__":
    # setproctitle.setproctitle('articam-py')
    add_process_id()
    camera = Camera()
    camera.setup()
    camera.run()
