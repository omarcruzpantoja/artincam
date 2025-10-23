# from artincam.camera import Camera
from artincam.agent import ArtincamAgent
import asyncio
import os
import signal


def get_env(name: str, required: bool = False):
    return os.getenv(name)


async def main():
    # camera = Camera()
    # camera.setup()
    # camera.run()

    agent = ArtincamAgent("1")
    agent.start()

    # Hook Ctrl+C for graceful exit
    stop_event = asyncio.Event()

    def handle_sigint():
        print("\n[Signal] Ctrl+C received.")
        stop_event.set()

    loop = asyncio.get_running_loop()
    loop.add_signal_handler(signal.SIGINT, handle_sigint)
    loop.add_signal_handler(signal.SIGTERM, handle_sigint)

    # Run until signal
    await stop_event.wait()

    # Cleanup
    await agent.stop()
    print("[Main] Exit complete.")


if __name__ == "__main__":
    asyncio.run(main())
