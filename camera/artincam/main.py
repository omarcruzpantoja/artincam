import json
import time
import pathlib

# import setproctitle
from enum import StrEnum
from datetime import datetime

from picamera2 import Picamera2
from picamera2.encoders import H264Encoder
from picamera2.outputs import FileOutput

from artincam.camera import Camera


ROOT_DIRECTORY = pathlib.Path(__file__).resolve().parent


class TimeUnit(StrEnum):
    SECOND = "s"
    MINUTE = "m"
    HOUR = "h"
    DAY = "d"


if __name__ == "__main__":
    camera = Camera()
    camera.setup()
    camera.run()
