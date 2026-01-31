import asyncio
import json
import threading
from queue import Queue

import websockets

from .camera import Camera
from .constants import BACKEND_HOST, USE_HTTPS, AgentMessage
from .schemas import CameraMessage, ConfigUpdate


class ArtincamAgent:
    _actions: Queue
    _stop: threading.Event
    _agent_id: str
    _camera_thread: threading.Thread

    def __init__(self, agent_id: str):
        self._actions = Queue()
        self._camera_messages = Queue()
        self._stop = threading.Event()
        self._agent_id = agent_id

        self.camera = Camera(agent_messages=self._camera_messages, stop_event=self._stop)
        self._camera_thread = threading.Thread(target=self.camera.run, daemon=True)
        self._ws_task = None
        self._ws = None

    def start(self):
        self._ws_task = asyncio.create_task(self._initialize_ws_connection())
        self._camera_thread.start()

    async def stop(self):
        # send signal to stop the camera loop
        self._stop.set()

        # close the websocket connection
        await self._ws.close()

        # stop the ws loop
        self._ws_task.cancel()

        # force camera loop to receive a message to close
        self._actions.put_nowait("exit")
        self._camera_messages.put_nowait((AgentMessage.EXIT, None))

        # wait for the camera thread to safely exit
        self._camera_thread.join()

    async def _initialize_ws_connection(self):
        """Continuously maintain a WebSocket connection with auto-reconnect."""
        while True:
            try:
                print("[WS] connecting to backend...")
                async with websockets.connect(
                    f"ws{'s' if USE_HTTPS else ''}://{BACKEND_HOST}/ws/v1/agent/{self._agent_id}"
                ) as ws:
                    self._ws = ws
                    print("[WS] connected.")

                    # Listen until closed
                    async for msg in ws:
                        self._parse_message(msg)

            except (websockets.ConnectionClosedError, websockets.ConnectionClosedOK, ConnectionRefusedError) as e:
                print(f"[WS] connection lost: {e}. Reconnecting in 5s...")

            except Exception as e:
                print(f"[WS] unexpected error: {e}. Reconnecting in 5s...")

            finally:
                # Always clear reference and pause before retry
                self._ws = None
                await asyncio.sleep(5)
                print("[WS] retrying connection...")

    def _parse_message(self, msg: str):
        try:
            parsed_msg: dict = json.loads(msg)

            match parsed_msg.get("type", ""):
                case "camera-command":
                    self._handle_camera_command(parsed_msg)
                case "config-update":
                    self._handle_config_update(parsed_msg)
                case _:
                    print("unknown message type:", parsed_msg.get("type", ""))

        except Exception as e:
            print("parsing error: ", e)

    def _handle_camera_command(self, msg: dict):
        schema = CameraMessage(**msg)
        self._camera_messages.put((AgentMessage.CHANGE_MODE, schema.mode))

    def _handle_config_update(self, msg: dict):
        schema = ConfigUpdate(**msg)
        self._camera_messages.put((AgentMessage.CONFIG_UPDATE, schema.config))
