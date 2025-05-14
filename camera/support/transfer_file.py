#!/usr/bin/env python3
import json
import os
import pathlib
import select
import shutil
import subprocess
import sys
import threading
import time

import psutil
from colorama import Fore, Style, init

# Initialize colorama for cross-platform support
init(autoreset=True)

CAMERA_DIRECTORY = pathlib.Path(__file__).resolve().parent.parent


class Color:
    # Using colorama's predefined colors
    WHITE = Fore.WHITE
    CYAN = Fore.CYAN
    RED = Fore.RED
    YELLOW = Fore.YELLOW
    GREEN = Fore.GREEN
    RESET = Style.RESET_ALL

    @staticmethod
    def red(text):
        return f"{Color.RED}{text}{Color.RESET}"

    @staticmethod
    def cyan(text):
        return f"{Color.CYAN}{text}{Color.RESET}"

    @staticmethod
    def white(text):
        return f"{Color.WHITE}{text}{Color.RESET}"

    @staticmethod
    def yellow(text):
        return f"{Color.YELLOW}{text}{Color.RESET}"

    @staticmethod
    def green(text):
        return f"{Color.GREEN}{text}{Color.RESET}"


class USBDeviceManager:
    _stop_event: threading.Event

    def __init__(self):
        self._find_usb_mount_points()
        self._stop_event = threading.Event()

    def choose_device(self):
        """
        Prompts the user to choose a USB storage device from a list.
        """
        if not self.usb_devices:
            print(Color.red("❌ No USB storage devices found."))
            return None

        print(Color.cyan("💬 Please choose a USB storage device for data transfer:"))
        for idx, usb in enumerate(self.usb_devices):
            print(f"{Color.yellow(f'{idx + 1}.')} Device: {usb['device']}, Mount Point: {usb['mount_point']}")

        try:
            choice = int(
                input(
                    Color.white(
                        f"From the listed devices, enter the number of the device you want to use (1-{len(self.usb_devices)}): "
                    )
                )
            )
            if 1 <= choice <= len(self.usb_devices):
                selected_device = self.usb_devices[choice - 1]
                print(f"{Color.cyan('You selected:')} {selected_device['mount_point']}")

                # Ask for confirmation
                selected_text = Color.yellow(f"You chose {selected_device['mount_point']}.")
                confirm = input(f"{selected_text} Is this correct? (Y/YES/y/yes): ").strip().lower()
                if confirm in ["y", "yes"]:
                    print(
                        f"{Color.green('Confirmed.')} You will be using {selected_device['mount_point']} for data transfer."
                    )
                    return selected_device
                else:
                    print(Color.red("❌ You did not confirm the device. Exiting..."))
                    return None
            else:
                print(Color.red("❌ Invalid choice, please select a valid device number."))
                return None
        except ValueError:
            print(Color.red("❌ Invalid input, please enter a number."))
            return None

    def _find_usb_mount_points(self):
        """
        Lists mounted filesystems that appear to be USB storage devices.
        """
        try:
            partitions = psutil.disk_partitions(all=False)
        except Exception as e:
            print(f"{Color.red(f'❌ Error getting disk partitions: {e}')}")
            return []

        self.usb_devices = []

        for p in partitions:
            if p.device.startswith("/dev/sd") and p.mountpoint and os.path.exists(p.mountpoint):
                self.usb_devices.append({"device": p.device, "mount_point": p.mountpoint})

    def perform_data_transfer(self, selected_device):
        """
        Method for performing the data transfer to the selected device.
        """
        one_GB = 2 * 30

        if selected_device:
            print(f"{Color.cyan('🚀 Transferring data to:')} {selected_device['mount_point']}")
            config = self._get_json_config()
            pi_id = config["camera"]["pi_id"]
            output_dir = config["camera"]["output_dir"]
            assets_dir = pathlib.Path(f"{CAMERA_DIRECTORY}/artincam/{output_dir}/")
            assets_dir.mkdir(parents=True, exist_ok=True)
            final_transfer_path = pathlib.Path(selected_device["mount_point"] + "/data/" + str(pi_id) + "/")
            final_transfer_path.mkdir(parents=True, exist_ok=True)

            transfer_count = 0
            start_time = time.time()
            interrupted = ""

            for file in sorted(filter(lambda f: f.is_file(), assets_dir.iterdir()))[:-2]:
                available_space = shutil.disk_usage(selected_device["mount_point"]).free
                if self._stop_event.is_set():
                    interrupted = "⚠️  Transfer was interrupted."
                    break
                elif available_space < file.stat().st_size or available_space < one_GB:
                    interrupted = "❌ Not enough space on the selected USB device for transfer."
                self._transfer_file(file, final_transfer_path)
                transfer_count += 1
                print(Color.green(f"✅ Transferred: {file.name}\n"))

            elapsed_time = time.time() - start_time
            transfer_message = interrupted if len(interrupted) > 0 else "📦 Transfer complete."
            summary = f"{transfer_message} {transfer_count} file(s) transferred in {elapsed_time:.2f} seconds (avg: {(elapsed_time / transfer_count):.2f} s per file)."

            print(Color.cyan(summary))
            self._stop_event.set()

    def _transfer_file(self, source, destination_directory):  # 4MB buffer
        """
        Transfer source file to destination and delete file once completed.
        """
        # Create the destination file path by combining the directory and filename
        destination = os.path.join(destination_directory, os.path.basename(source))
        subprocess.run(
            ["rsync", "--progress", "--remove-source-files", source, destination], check=True
        )  # Blocks until the rsync process completes

    def _get_json_config(self):
        return json.load(open(CAMERA_DIRECTORY / "artincam" / "config" / "config.json", "r"))

    def _key_listener(self):
        """
        Listens for the 'q' key being held for 3 seconds to trigger exit.
        """

        print(Color.cyan("🔍 Type for 'stop' and press enter to gracefully exit..."))

        while not self._stop_event.is_set():
            rlist, _, _ = select.select([sys.stdin], [], [], 2)
            if rlist:
                user_input = sys.stdin.readline().strip().lower()
                if user_input == "stop":
                    print(
                        Color.red(
                            "\nStop command found. Gracefully exiting: once the current file is finished transfering the program will stop."
                        )
                    )
                    self._stop_event.set()
                    break


if __name__ == "__main__":
    usb_manager = USBDeviceManager()

    selected_device = usb_manager.choose_device()
    if selected_device:
        # Perform the data transfer with the selected device
        transfer_thread = threading.Thread(target=usb_manager.perform_data_transfer, args=(selected_device,))
        monitor_thread = threading.Thread(target=usb_manager._key_listener)
    else:
        print(Color.red("❌ No valid device selected."))
        exit(-1)

    transfer_thread.start()
    monitor_thread.start()

    transfer_thread.join()
    monitor_thread.join()
