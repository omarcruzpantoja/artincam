import os
from enum import Enum


def get_env(name: str, required: bool = False):
    # TODO: this needs to be moved to a utils
    value = os.getenv(name)

    if required and value is None:
        raise EnvironmentError(f"Environment variable '{name}' is required but not set.")

    return value


ARTINCAM_AGENT_ID = get_env("ARTINCAM_AGENT_ID", required=True)
BACKEND_HOST = get_env("BACKEND_HOST", required=True)
USE_HTTPS = get_env("USE_HTTPS", required=False) == "1"


class AgentMessage(Enum):
    CHANGE_MODE = "change_mode"
    CONFIG_UPDATE = "config_update"
    EXIT = "exit"
