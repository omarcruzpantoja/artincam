import asyncio
import json
import os
from queue import Queue, Empty as QueueEmpty
import threading

import websockets


from .camera import Camera
from .constants import CameraAction
from .schemas import CameraCommand


def get_env(name: str, required: bool = False):
    # TODO: this needs to be moved to a utils
    return os.getenv(name)


class ArtincamAgent:
    _actions: Queue
    _stop: threading.Event
    _mode: str
    _agent_id: str
    _camera_thread: threading.Thread

    def __init__(self, agent_id: str):
        self._actions = Queue()
        self._camera_actions = Queue()
        self._stop = threading.Event()
        self._mode = "idle"
        self._agent_id = agent_id

        self.camera = Camera(camera_actions=self._camera_actions, stop_event=self._stop)
        self.camera.setup()
        self._camera_thread = threading.Thread(target=self.camera.run, daemon=True)
        self._ws_task = None
        self._ws = None

    def start(self):
        self._camera_thread.start()
        self._ws_task = asyncio.create_task(self._initialize_ws_connection())

    async def stop(self):
        # send signal to stop the camera loop
        self._stop.set()

        # close the websocket connection
        await self._ws.close()

        # stop the ws loop
        self._ws_task.cancel()

        # force camera loop to receive a message to close
        self._actions.put_nowait("exit")
        self._camera_actions.put_nowait((CameraAction.EXIT, None))

        # wait for the camera thread to safely exit
        self._camera_thread.join()

    def _camera_loop(self):
        while not self._stop.is_set():
            try:
                cmd = self._actions.get()
                self._mode = cmd
            except QueueEmpty:
                pass

            print(f"[Camera] Running in mode: {self._mode}")

    async def _initialize_ws_connection(self):
        """Continuously maintain a WebSocket connection with auto-reconnect."""
        while True:
            try:
                print("[WS] connecting to backend...")
                async with websockets.connect(
                    f"ws://{get_env('BACKEND_SERVICE_URL')}/ws/agent?x-agent-id={self._agent_id}"
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

        except Exception as e:
            print("parsing error: ", e)

    def _handle_camera_command(self, msg: dict):
        schema = CameraCommand(**msg)
        self._camera_actions.put((CameraAction.CHANGE_MODE, schema.mode))
