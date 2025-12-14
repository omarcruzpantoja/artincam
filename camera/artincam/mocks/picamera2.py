import logging

logger = logging.getLogger(__name__)


class Picamera2:
    def __init__(self):
        self.main = None
        self.controls = None
        self.width = None
        self.height = None
        self.framerate = None
        self.started = False

        self.pre_callback = None

    def start(self):
        logger.debug("[PICAMERA2] start")
        self.started = True

    def capture_file(self, filename: str):
        return
        logger.debug(f"[PICAMERA2] capture_file ({self.height}, {self.width}) to {filename}")

    def start_encoder(self, filename: str):
        return
        logger.debug(f"[PICAMERA2] start_encoder ({self.height}, {self.width} at {self.framerate}) to {filename}")

    def stop_encoder(self):
        logger.debug("[PICAMERA2] stop_encoder")

    def stop(self):
        logger.debug("[PICAMERA2] stop")
        self.started = False

    def close(self):
        logger.debug("[PICAMERA2] close")

    def create_video_configuration(self, main=None, controls=None, transform=None):
        main = main or {}
        controls = controls or {}
        return {"main": main, "controls": controls, "transform": transform}

    def configure(self, config):
        self.main = config["main"]
        self.height = self.main.get("size", [640, 480])[0]
        self.width = self.main.get("size", [640, 480])[1]

        self.controls = config["controls"]
        self.framerate = 1_000_000 / self.controls.get("FrameDurationLimits", (33_333, 33_333))[0]


class MappedArray:
    pass


class H264Encoder:
    def __init__(self, bitrate: int | None, framerate: int = None, enable_sps_framerate: bool = False):
        self.bitrate = bitrate
        self.framerate = framerate
        self.enable_sps_framerate = enable_sps_framerate
        self.output = []


class FfmpegOutput:
    def __init__(self, output: str):
        self.output = output
        self.output_filename = ""


class PyavOutput:
    def __init__(self, rstp_address: str, format: str):
        self.rstp_address = rstp_address
        self.format = format
