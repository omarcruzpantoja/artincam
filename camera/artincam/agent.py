import asyncio
import json
import os
import queue
import threading
import websockets


def get_env(name: str, required: bool = False):
    # TODO: this needs to be moved to a utils
    return os.getenv(name)


class ArtincamAgent:
    _actions: queue.Queue
    _stop: threading.Event
    _mode: str
    _agent_id: str
    _camera_thread: threading.Thread

    def __init__(self, agent_id: str):
        self._actions = queue.Queue()
        self._stop = threading.Event()
        self._mode = "idle"
        self._agent_id = agent_id

        self._camera_thread = threading.Thread(target=self._camera_loop, daemon=True)
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

        # wait for the camera thread to safely exit
        self._camera_thread.join()

    def _camera_loop(self):
        while not self._stop.is_set():
            try:
                cmd = self._actions.get()
                print(f"[Camera] Got command: {cmd}")
                self._mode = cmd
            except queue.Empty:
                pass

            print(f"[Camera] Running in mode: {self._mode}")

    async def _initialize_ws_connection(self):
        self._ws = await websockets.connect(
            f"ws://{get_env('BACKEND_SERVICE_URL')}/ws/agent?x-agent-id={self._agent_id}"
        )

        try:
            async for msg in self._ws:
                if cmd := self._parse_message(msg):
                    self._actions.put(cmd)

        except Exception as e:
            print("WS error:", e)
            await asyncio.sleep(5)  # reconnect

    def _parse_message(msg: str):
        try:
            return json.loads(msg)
        except Exception as e:
            print("parsing error: ", e)
