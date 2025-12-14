import logging
import os
import pathlib
import shutil
import threading
import time
from datetime import datetime, timezone
from enum import StrEnum
from queue import Queue

import cv2
import psutil

from .backend_service import BackendService
from .constants import ARTINCAM_AGENT_ID, AgentMessage
from .schemas import (
    ActionLog,
    ArtincamPiAgentConfig,
    ArtincamPiCamera,
    AssetFile,
    AssetFileTypeEnum,
    ModeEnum,
    StatusEnum,
)

# libcamera and pimcamera2 will already be installed in the raspberry pis
# when working outside a raspberry PI we will use a libcamera and picamera mocks
# to help us test. But camera controls will only occur in the actual raspberry pi
try:
    from libcamera import Transform
    from picamera2 import MappedArray, Picamera2
    from picamera2.encoders import H264Encoder
    from picamera2.outputs import FfmpegOutput, PyavOutput
except ModuleNotFoundError:
    from .mocks.libcamera import Transform
    from .mocks.picamera2 import Picamera2, MappedArray, H264Encoder, FfmpegOutput, PyavOutput

from .logger import logger

DEFAULT_BITRATE = 8_388_608  # example: 8MB
ROOT_DIRECTORY = pathlib.Path(__file__).resolve().parent
logger.setLevel(logging.INFO)
one_GB = 2**30


class TimeUnit(StrEnum):
    SECOND = "s"
    MINUTE = "m"
    HOUR = "h"
    DAY = "d"


class APIMethod(StrEnum):
    POST = "POST"
    PATCH = "PATCH"


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
    _mode: ModeEnum
    _status: StatusEnum

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

    _agent_messages: Queue[tuple[AgentMessage, dict | None]] | None
    _stop: threading.Event
    _interrupt_sleep: threading.Event

    _backend_client: BackendService
    _messages_to_backend: Queue

    picam: Picamera2
    encoder: H264Encoder
    ffmpeg_output: FfmpegOutput
    file_counter: FileCounter

    def __init__(
        self,
        agent_messages: Queue[tuple[AgentMessage, dict | None]],
        stop_event: threading.Event,
    ):
        # bit rate data
        # 33554432 (33MB)- 30MB per 10s video
        # 16777216 (16MB)- 20MB per 10s video
        #  8388608 ( 8MB)- 10MB per 10s video

        # Recommended 8MB bitrate

        # Resolution
        # 1640 x 1232
        # Note: 1920x1080 should not be used, it limits the FoV of the camera. Not good.
        # default values
        self._framerate = 24
        self._status = StatusEnum.STOPPED
        self._bitrate = DEFAULT_BITRATE
        self._vertical_flip = False
        self._horizontal_flip = False
        self._width = 1640
        self._height = 1232
        self._pi_id = None
        self._location = None
        self._output_path = ROOT_DIRECTORY
        self._camera_config = None

        self.picam = Picamera2()
        self.file_counter = FileCounter()
        self._agent_messages = agent_messages
        self._stop = stop_event
        self._interrupt_sleep = threading.Event()
        self._camera_config = None
        self._backend_client = BackendService()

        self._agent_message_thread = threading.Thread(
            target=self._camera_listener_loop,
            daemon=True,
        )
        self._agent_message_thread.start()
        self._messages_to_backend = Queue()

        self._camera_callbacks_thread = threading.Thread(
            target=self._camera_callbacks_loop,
            daemon=True,
        )
        self._camera_callbacks_thread.start()
        self._health_check_thread = threading.Thread(
            target=self._health_check_loop,
            daemon=True,
        )
        self._health_check_thread.start()

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
        while self._camera_config is None and not self._stop.is_set():
            logger.info("[Camera] Waiting for initial configuration...")
            self._interruptable_sleep(10)

        # initial camera setup
        self.setup()
        # initialize camera
        self.picam.start()
        self._use_timestamp_overlay()
        self._sleep(2)  # let the camera start running properly

        while not self._stop.is_set():  # while stop event is not set, keep running
            if self._status != StatusEnum.ACTIVE:
                self._sleep(1)
                continue

            match self._mode:
                case ModeEnum.IMAGE:
                    self._capture_image()
                    self._interruptable_sleep(self._image_rest_time)

                case ModeEnum.VIDEO:
                    self._capture_video()
                    self._interruptable_sleep(self._cycle_rest_time)

                case ModeEnum.IMAGE_VIDEO:
                    start_time = time.time()

                    while time.time() - start_time < self._image_capture_time and not self._break_cycle_condition():
                        self._capture_image(sleep=True)
                        self._interruptable_sleep(self._image_rest_time)

                        if self._break_cycle_condition():
                            break

                        self._capture_video(sleep=True)
                        self._interruptable_sleep(self._cycle_rest_time)

                case ModeEnum.RTSP_STREAM:
                    self._capture_stream()

                case _:
                    self._sleep(1)

            self._interrupt_sleep.clear()
        self._messages_to_backend.put(None)
        self.picam.stop_encoder()
        self.picam.stop()
        self.picam.close()

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
    def _capture_image(self, sleep: bool = False):
        # Capture the image and save to a file
        output_filepath, asset_file = self._get_asset_file_meta(AssetFileTypeEnum.IMAGE, image=True)
        self._current_time = time.strftime("%Y-%m-%d %X")
        self._messages_to_backend.put(self._create_asset_file_callback(asset_file))
        self.picam.capture_file(output_filepath)
        file_path = pathlib.Path(output_filepath)
        asset_file.file_size = 0 if not file_path.exists() else file_path.stat().st_size
        self._messages_to_backend.put(self._update_asset_file_callback(asset_file))
        self.file_counter.increment_counter()
        logger.debug(f"Image taken, storing in ({output_filepath})\nImage Resting...({self._image_rest_time})")

    def _capture_video(self):
        output_filepath, asset_file = self._get_asset_file_meta(AssetFileTypeEnum.VIDEO)
        self._messages_to_backend.put(self._create_asset_file_callback(asset_file))
        self.ffmpeg_output.output_filename = output_filepath
        logger.debug(f"Starting Recording ({self._recording_time}s)")
        self.picam.start_encoder(self.encoder)

        # record for however many seconds. On each second update timestamp
        for _ in range(self._recording_time):
            if self._interruptable_sleep(1):
                break

            self._current_time = time.strftime("%Y-%m-%d %X")

        # once time is finished, stop recording
        self.picam.stop_encoder()
        self.file_counter.increment_counter()
        file_path = pathlib.Path(output_filepath)
        asset_file.file_size = 0 if not file_path.exists() else file_path.stat().st_size
        self._messages_to_backend.put(self._update_asset_file_callback(asset_file))

    def _capture_stream(self):
        rtsp_stream_output = PyavOutput(self._camera_config.rtsp_stream.address, format="rtsp")
        self.encoder.output = [rtsp_stream_output]
        self.picam.start_encoder(self.encoder)

        while not self._break_cycle_condition():
            self._current_time = time.strftime("%Y-%m-%d %X")
            self._interruptable_sleep(1)

        self.picam.stop_encoder()

    # ----- VALIDATORS AND CONFIG -----
    def _set_config_update(self, config: ArtincamPiAgentConfig):
        camera_config: ArtincamPiCamera = config.camera
        self._camera_config = camera_config
        transforms = camera_config.transforms

        self._mode = camera_config.mode
        self._status = camera_config.status
        # unit used to define video recording time, default is minutes (m)
        image_capture_time_unit = self._set_time_unit_conversion(camera_config.image_capture_time_unit)
        image_rest_time_unit = self._set_time_unit_conversion(camera_config.image_rest_time_unit)
        recording_time_unit = self._set_time_unit_conversion(camera_config.recording_time_unit)
        cycle_rest_time_unit = self._set_time_unit_conversion(camera_config.cycle_rest_time_unit)

        # ----- STREAM SETUP -----
        self._vertical_flip = transforms.vertical_flip
        self._horizontal_flip = transforms.horizontal_flip

        # ----- IMAGE SETUP -----
        # how many images to be taken per cycle (only used in image/video mode)
        self._image_capture_time = camera_config.image_capture_time * image_capture_time_unit
        # wait time between images
        self._image_rest_time = camera_config.image_rest_time * image_rest_time_unit

        # ----- VIDEO SETUP -----
        # how long should each video be, default is 10
        self._recording_time = camera_config.recording_time * recording_time_unit

        # rest time defines how much time to wait till next video starts being saved, default is 0
        # this means, once a video is finished being recorded, the next one will start being recorded
        # immediately
        self._cycle_rest_time = camera_config.cycle_rest_time * cycle_rest_time_unit

        # how many frames per second, default 24
        self._framerate = camera_config.framerate

        # bitrate is used to determine the quality of image during compression. The higher the value the
        # better quality image, the more space it takes
        self._bitrate = camera_config.bitrate

        # how many width pixels, think of it as if you were providing measurements for a box ( width x height )
        # the bigger width x height, the better the image, the more storage it takes. Default is 1640
        self._width = camera_config.resolution.width
        # how many height pixels, default is 1232
        self._height = camera_config.resolution.height

        # location of where the rapsberry pi will be located in, no default value, must only have hyphens and lower
        # case letters with a max of 30 characters
        self._location = camera_config.location

        # identifier of raspberry pi, no default value
        self._pi_id = camera_config.pi_id

        # where to store recordings
        self._output_path = pathlib.Path(f"{ROOT_DIRECTORY}/{camera_config.output_dir}")
        self._output_path.mkdir(parents=True, exist_ok=True)

    def _set_time_unit_conversion(self, unit: TimeUnit):
        """Depending on the file config's time unit, define the multiplier to convert whatever unit
        provided to seconds.
        """
        match unit:
            case TimeUnit.SECOND:
                return 1
            case TimeUnit.MINUTE:
                # There's 60 seconds in a minute
                return 60
            case TimeUnit.HOUR:
                # There's 60 minutes in an hour, each minute has 60 seconds = 60 * 60
                return 3600
            case TimeUnit.DAY:
                # There's 24 hours a day, 60 minutes in an hour, each minute has 60 seconds = 24 * 60 * 60
                return 86400

    # ----- UTILS -----
    def _get_asset_file_meta(self, file_type: AssetFileTypeEnum, image=False) -> tuple[str, AssetFile]:
        """Defines the name of the file generated for the video."""

        # Automatically add data to usb stick if it can be found, otherwise save in the local disk
        usb_mount_point = self._find_usb_mount_points()
        if usb_mount_point and shutil.disk_usage(usb_mount_point).free > one_GB:
            final_transfer_path = pathlib.Path(usb_mount_point + "/data/" + str(self._pi_id) + "/")
        else:
            final_transfer_path = self._output_path

        final_transfer_path.mkdir(parents=True, exist_ok=True)

        # the timestamp format here aims to do: YYYYMMDDHHmmSS
        # Example: Say its Feb 20 2025, 6:03:10AM. The format would look like: 20250220060313
        current_time = datetime.now(timezone.utc)
        timestamp = current_time.strftime("%Y%m%d%H%M%S")
        unique_id = f"{str(self._pi_id).zfill(4)}-{str(self.file_counter.counter).zfill(10)}"

        # The complete filename however would look like:
        # 1_sj-pr-usa-20-02-2025-06-03-10_UUIDV6.mkv
        # Assuming _pi_id = 1, _location = sj-pr-usa
        file_stride = "jpg" if image else "mkv"
        file_name = "{timestamp}_{unique_id}_{location}.{file_stride}".format(
            timestamp=timestamp,
            unique_id=unique_id,
            location=self._location,
            file_stride=file_stride,
        )
        asset_file = AssetFile(
            agent_id=ARTINCAM_AGENT_ID,
            camera_id=str(self._pi_id),
            location=self._location,
            timestamp=current_time.isoformat(),
            unique_id=unique_id,
            file_name=file_name,
            file_size=-1,
            file_type=file_type,
        )

        return str(final_transfer_path / file_name), asset_file

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

    def _interruptable_sleep(self, seconds: float) -> bool:
        if self._break_cycle_condition():
            return True

        return self._interrupt_sleep.wait(timeout=seconds)

    def _break_cycle_condition(self) -> bool:
        return self._interrupt_sleep.is_set() or self._stop.is_set()

    def _process_message(self, message: AgentMessage, params: str | ArtincamPiAgentConfig):
        match message:
            case AgentMessage.CONFIG_UPDATE:
                config: ArtincamPiAgentConfig = params
                self._status = StatusEnum.STOPPED
                self._interrupt_sleep.set()
                self._set_config_update(config)
                logger.info("[Camera] Configuration updated.")
                logger.info("[Camera] Stopping camera to update configuration...")
                self.picam.stop_encoder()
                self.picam.stop()

                while self.picam.started:
                    time.sleep(0.1)

                logger.info("[Camera] Applying new configuration...")
                self.setup()
                logger.info("[Camera] Restarting camera with new configuration...")
                self.picam.start()
                self._interrupt_sleep.clear()

    # ---- thread loops ----
    def _camera_listener_loop(self):
        # thread used to listen for events that are sent to the agent

        while not self._stop.is_set():
            msg = self._agent_messages.get()
            self._process_message(msg[0], msg[1])

    def _camera_callbacks_loop(self):
        # thread used to run action callbacks (for example making api calls to the backend)

        while not self._stop.is_set():
            callback = self._messages_to_backend.get()

            if callback is None:
                break

            callback()

    def _health_check_loop(self):
        while not self._stop.is_set():
            if self._status == StatusEnum.ACTIVE:
                self._messages_to_backend.put(self._health_check_log_callback())
            time.sleep(5)

    # ---- CAMERA CALLBACKS ----
    def _create_asset_file_callback(self, asset_file: AssetFile):
        def callback():
            response = self._backend_client.create_asset_file(asset_file)

            if response is None:
                return

            payload = response.json()
            asset_file.id = payload["data"]["id"]

        return callback

    def _update_asset_file_callback(self, asset_file: AssetFile):
        def callback():
            if asset_file.id is None:
                logger.error("[Camera] asset_file.id is required for update")
                return

            self._backend_client.update_asset_file(asset_file)

        return callback

    def _health_check_log_callback(self):
        # todo only send health logs when the camera is acrively sending data
        action_log = ActionLog(agent_id=ARTINCAM_AGENT_ID, category="health", message={"OK": "OK"})

        def callback():
            self._backend_client.create_action_log(action_log)

        return callback
