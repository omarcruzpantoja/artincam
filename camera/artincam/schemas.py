from pydantic import BaseModel


class CameraCommand(BaseModel):
    mode: str
    type: str
