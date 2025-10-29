from enum import Enum


class AgentMessage(Enum):
    CHANGE_MODE = "change_mode"
    CONFIG_UPDATE = "config_update"
    EXIT = "exit"
