from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ----- DB Schema Models-----
class AssetFileTypeEnum(Enum):
    IMAGE = "image"
    VIDEO = "video"


class AssetFile(BaseModel):
    id: Optional[int] = Field(None, description="Primary key")
    camera_id: str = Field(..., description="Camera ID")
    location: str = Field(..., description="Location", max_length=512)
    timestamp: str = Field(..., description="Timestamp in ISO format")
    unique_id: str = Field(..., description="Unique ID", max_length=64)
    file_name: str = Field(..., description="File name", max_length=256)
    file_size: int = Field(0, description="File size in bytes", ge=-1)
    file_type: AssetFileTypeEnum


# ----- END DB Schema -----


# ----- Artincam Pi Agent Config -----
class ModeEnum(str, Enum):
    RTSP_STREAM = "rtsp_stream"
    VIDEO = "video"
    IMAGE = "image"
    IMAGE_VIDEO = "image/video"


class StatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    STOPPED = "STOPPED"
    FAILURE = "FAILURE"


class TimeUnitEnum(str, Enum):
    S = "s"
    M = "m"
    H = "h"
    D = "d"


class ArticamPiResolution(BaseModel):
    width: int = Field(1640, description="Width in pixels", example=1640, ge=1)
    height: int = Field(1232, description="Height in pixels", example=1232, ge=1)


class ArticamPiRtspStream(BaseModel):
    address: str = Field(..., description="RTSP stream address")


class ArtincamPiTransforms(BaseModel):
    vertical_flip: bool = Field(False, description="Flip vertically")
    horizontal_flip: bool = Field(False, description="Flip horizontally")


class ArtincamPiCamera(BaseModel):
    mode: ModeEnum = Field(..., description="Camera mode")
    status: Optional[StatusEnum] = Field(None, description="Operational status")

    resolution: ArticamPiResolution = Field(..., description="Output resolution")

    rtsp_stream: Optional[ArticamPiRtspStream] = Field(
        None, description="RTSP stream settings (required.address if present)"
    )

    transforms: ArtincamPiTransforms = Field(default_factory=ArtincamPiTransforms)

    framerate: int = Field(24, description="Frames per second (>=1)", ge=1)
    bitrate: int = Field(8388608, description="Bitrate (>=1)", ge=1)

    recording_time: int = Field(10, description="Recording time", example=10, ge=1)
    recording_time_unit: TimeUnitEnum = Field(TimeUnitEnum.S, description="Unit for recording_time")

    cycle_rest_time: int = Field(0, description="Rest time between cycles", ge=0)
    cycle_rest_time_unit: TimeUnitEnum = Field(TimeUnitEnum.S, description="Unit for cycle_rest_time")

    output_dir: str = Field(..., description="Directory where outputs are saved")
    location: str = Field(
        ...,
        description="Lowercase letters, digits and hyphens only, max 30 chars",
        max_length=30,
        pattern=r"^[a-z0-9-]+$",
    )

    pi_id: int = Field(..., description="Pi id (0..9999)", ge=0, le=9999)

    image_capture_time: int = Field(5, description="Image capture time", ge=1)
    image_capture_time_unit: TimeUnitEnum = Field(TimeUnitEnum.S, description="Unit for image_capture_time")

    image_rest_time: int = Field(10.0, description="Rest time between images", ge=0)
    image_rest_time_unit: TimeUnitEnum = Field(TimeUnitEnum.S, description="Unit for image_rest_time")


class ArtincamPiAgentConfig(BaseModel):
    camera: ArtincamPiCamera = Field(..., description="Camera configuration")


# ---- END Artincam Pi Agent Config -----


# ----- Websocket Schemas -----
class CameraMessage(BaseModel):
    mode: str
    type: str


class ConfigUpdate(BaseModel):
    type: str
    config: ArtincamPiAgentConfig


# ----- END Websocket Schemas -----
