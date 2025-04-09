import json
import time
import pathlib

from picamera2 import Picamera2, Preview


ROOT_DIRECTORY = pathlib.Path(__file__).resolve().parent
CONFIG_PATH = ROOT_DIRECTORY / "config/config.json"

# load camera config to get the resolution wanted
config = json.loads(open(CONFIG_PATH, "r").read())
camera = config["camera"]
resolution = camera["resolution"]

# use 24 frames per second for preview
frame_duration = 1000000 // 24

picam = Picamera2()
picam.start_preview(Preview.QTGL)

video_config = picam.create_preview_configuration(
    main={"size": (resolution["height"], resolution["width"])},
    controls={"FrameDurationLimits": (frame_duration, frame_duration)},
)

picam.configure(config)
picam.start()

# stop the camera after 1 hour
time.sleep(3600)
