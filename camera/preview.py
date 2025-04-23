import json
import pathlib
import time

from libcamera import ColorSpace
from picamera2 import Picamera2, Preview

ROOT_DIRECTORY = pathlib.Path(__file__).resolve().parent
CONFIG_PATH = ROOT_DIRECTORY / "artincam/config/config.json"

# load camera config to get the resolution wanted
config = json.loads(open(CONFIG_PATH, "r").read())
camera = config["camera"]
resolution = camera["resolution"]

# use 24 frames per second for preview
frame_duration = 1000000 // 24

picam = Picamera2()


video_config = picam.create_preview_configuration(raw=picam.sensor_modes[1])
video_config = picam.create_preview_configuration(
    {"size": (resolution["width"], resolution["height"])},
    controls={"FrameDurationLimits": (frame_duration, frame_duration)},
    colour_space=ColorSpace.Sycc(),
)
picam.configure(video_config)

picam.start_preview(Preview.QTGL)
picam.start()

# stop the camera after 1 hour
time.sleep(3600)
