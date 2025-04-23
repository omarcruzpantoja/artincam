# Artincam project

- [Artincam project](#artincam-project)
  - [Overview](#overview)
  - [Setting up PI for the first time](#setting-up-pi-for-the-first-time)
  - [Camera Configuration Parameters](#camera-configuration-parameters)
    - [General Settings](#general-settings)
    - [Image Capture Settings](#image-capture-settings)
    - [Video Capture Settings](#video-capture-settings)
    - [Resolution Settings](#resolution-settings)
    - [What is a "cycle"?](#what-is-a-cycle)
      - [Example Configuration](#example-configuration)
        - [Example #1](#example-1)
        - [Example #2](#example-2)
    - [File Naming Format](#file-naming-format)
    - [Running the Camera (as a script and not a service)](#running-the-camera-as-a-script-and-not-a-service)
      - [Notes](#notes)
  - [Transfering files from output directory to usb stick](#transfering-files-from-output-directory-to-usb-stick)
  - [Artincam service commmands](#artincam-service-commmands)
    - [Preview camera](#preview-camera)
  - [Updating repo to its latest](#updating-repo-to-its-latest)


## Overview

Artincam is a Raspberry Pi camera project designed to automate the capture of images and videos using the Raspberry Pi Camera Module, powered by the `picamera2` library. The project provides a flexible and configurable pipeline that supports multiple recording modes including image-only, video-only, and a hybrid image/video cycle. It is designed with field deployments in mind, where minimal user interaction is preferred, and all operations can be controlled via configuration files and system services.

The camera system is highly customizable, allowing you to set parameters such as resolution, framerate, bitrate, duration, number of images per cycle, and capture intervals. Configuration is managed via JSON files and editable through built-in support tools.

Artincam is also service-enabled through `systemd`, meaning it can be started, stopped, or monitored like any standard Linux service. This ensures robustness and auto-restart capabilities when deployed long-term.

A key feature of the project is its simple file transfer utility, enabling easy offloading of recorded media files to a USB device through a guided interactive script. It also includes functionality for camera previewing, manual operation (outside the service), and seamless configuration management.

Whether you're setting this up on a fresh Raspberry Pi or updating an existing deployment, the provided shell scripts, configuration tools, and project structure provide a streamlined experience.


## Setting up PI for the first time


1. **Turn on VNC server using SSH connection (LAN cable connection using `zacpi.local` hostname)**

   VNC (Virtual Network Computing) allows you to control your Raspberry Pi's desktop environment remotely from another computer. This step enables you to visually interact with the Raspberry Pi.

   - First, establish an SSH connection to your Raspberry Pi using its hostname (e.g., `zacpi.local`) via terminal or an SSH client.
   - Run the following commands and options in the terminal to enable VNC:
     ```shell
     sudo raspi-config
     ```
     This opens the configuration menu.
   
     - Select **Interface Options**.
     - Choose **VNC**.
     - Select **Yes** to enable VNC.
     - Choose **Finish** to exit the configuration.

   - Once VNC is enabled, use a **VNC Viewer** to connect to the Raspberry Pi using the hostname (e.g., `zacpi.local`), or its IP address.
   - You will be prompted for the Raspberry Pi's **username** and **password** (default is usually `pi` and `raspberry` unless changed).

2. **Set Static IP (for LAN cable connection)**  
   If you're connecting over a LAN cable, set a static IP to ensure stable access:
   - Open the network settings on your Raspberry Pi.
   - Go to the **IPv4** settings and set a static IP, such as `192.168.0.101` with a subnet mask of `/24`.

3. **Establish Wi-Fi connection**  
   Connect the Raspberry Pi to Wi-Fi to download the latest updates and dependencies for the project.

4. **Clone the repo**
   ```shell
   git clone https://github.com/omarcruzpantoja/artincam.git
   cd artincam

5. Run all the commands in [`init_pi.sh`](./init_pi.sh)
   * Make sure all commands succeed

6. Change camera configuration of the raspberry pi
   ```shell
   cd /opt/artincam/camera
   uv run support/edit_config.py
   ```

## Camera Configuration Parameters

### General Settings
| Parameter         | Description |
|------------------|-------------|
| mode           | Determines the operation mode: image, video, or image/video. |
| output_dir     | Directory where captured images and videos are stored. |
| location       | Describes the camera's physical location. (can only have lower case letters and hyphens)|
| pi_id          | Unique identifier for the Raspberry Pi. (integer from 0 to 9999) |

### Image Capture Settings
| Parameter           | Description |
|--------------------|-------------|
| image_capture_time | Total duration to keep capturing images for each cycle. |
| image_rest_time    | Time (in seconds) between image captures. |
| image_time_unit    | Unit of time for image_capture_time (s, m, h, d). |

### Video Capture Settings
| Parameter          | Description |
|-------------------|-------------|
| recording_time  | Duration of each video in seconds. |
| framerate       | Number of frames per second (default: 24). |
| cycle_rest_time | Time delay before starting the next video cycle. |
| bitrate         | Video compression quality (higher values increase quality and file size). Recommended: 8388608 (8MB). |
| unit_time       | Time unit for video recording duration (s, m, h, d). |

### Resolution Settings
| Parameter      | Description |
|--------------|-------------|
| resolution.width  | Video width in pixels (default: 1640). |
| resolution.height | Video height in pixels (default: 1232). |

> Note: A resolution of 1920x1080 is not recommended as it limits the Field of View (FoV).

### What is a "cycle"?
In image/video mode, the concept of "cycles" becomes relevant. A cycle involves capturing a series of images followed by recording a video, all controlled by specific timing parameters. Here's a quick overview of how a cycle works:

1. For `image_capture_time`, the camera will repeatedly:
   * take an image
   * wait for `image_rest_time`
   * repeat until the total elapsed time reaches `image_capture_time`

2. Once the image capture window has ended, the camera will record a video.

3. The video will last `recording_time`

4. After the video has been recorded, there will be a "sleep" time where nothing is done. This is defined by `cycle_rest_time`.

5. Once the sleep is finished, the cycle has finished and it restarts from the top (step 1).

#### Example Configuration

##### Example #1
To create a configuration for capturing 1 image per minute for 50 minutes and recording a 10-minute video at 5 fps, the key values in the JSON would have the following values

```python
image_capture_time=1
image_rest_time=1
image_time_unit=m

recording_time=10
framerate=5
# cycle rest time with value of 0 implies, start the next cycle immediately
cycle_rest_time=0
unit_time=m
```

##### Example #2
Goal an image every 2 seconds for 50 minutes and a 10 minute recording video. 

```python
image_capture_time=50
image_rest_time=2
image_time_unit=s

recording_time=10
framerate=5
cycle_rest_time=0
unit_time=m
```

Note: the provided example above is NOT JSON format. This is just displaying what would be the values. 

### File Naming Format
Each recorded file follows the format:

```shell
{pi_id}_{location}_{timestamp}_{unique_identifer}.{ext}
```

Example:

```shell
1_sj-pr-usa_20-02-2025-06-03-10_0012-0000000012.h264
```

Where:

* `pi_id` → Unique identifier of the Raspberry Pi

* `location` → Location of the Raspberry Pi

* `timestamp` → Capture timestamp in dd-mm-yyyy-hh-mm-ss

* `unique identifier` → Uses pi_id and a counter to create identifier with 0 padding (4 on pi_id and 10 on counter)

* `ext` → jpg for images, mkv for videos

### Running the Camera (as a script and not a service)

Place your configuration file in config/config.json (there is one already by default).

Run the script:

If you havent set up uv venv: `uv venv --system-site-packages` and `uv sync --all-extras`

uv run main.py

#### Notes

The script automatically adjusts time units (seconds, minutes, hours, days) based on the configuration.

For any issues, refer to the official picamera2 documentation.


## Transfering files from output directory to usb stick
```shell
# change directory to artincam repo, camera folder
cd /opt/artincam/camera

# run command to initiate transfer file
./support/transfer_files.sh

# If there is a usb stick to transfer files to, you should be prompted with the option to choose a usb to transfer data to. Choose from the list (1 through X number of devices)

# Confirm that your selection is correct with Y or YES or y or yes

# Stop the transfer at any point by pressing and holding the letter q for 3 seconds. This will gracefully stop the transfer, once the current file transfer is finished, the process will be stopped.
```


## Artincam service commmands


| **Category**                  | **Description**                          | **Command**                                                                                              |
|------------------------------|------------------------------------------|----------------------------------------------------------------------------------------------------------|
| **Artincam Service Commands**| Check status of the service              | `sudo systemctl status artincam`                                                                         |
|                              | Start the camera                         | `sudo systemctl start artincam`                                                                          |
|                              | Stop the camera                          | `sudo systemctl stop artincam`                                                                           |
| **Camera Configuration**     | Display current camera config values     | `cd /opt/artincam/camera`<br>`uv run support/show_config.py`                                             |
|                              | Edit camera config values                | `cd /opt/artincam/camera`<br>`uv run support/edit_config.py`                                             |
|                              | Preview camera                           | `sudo systemctl stop artincam`<br>`cd /opt/artincam/camera`<br>`uv run preview.py`                       |
| **Repository Update**        | Update repo to latest version            | `cd /opt/artincam`<br>`git pull`<br>`cd camera`<br>`uv sync --all-extras`                                |

### Preview camera

It is important to note that there can only be 1 process using the camera at a time. This means that if you want to run the `preview`, the artincam service must be stopped. Additionally, in order for the camera preview to be visible, user must have a monitor of some kind. Whether its through VNC or an actual monitor connected to the raspberry PI directly.

```shell
# ensure the artincam service is not running and the picamera is free to be used
sudo systemctl stop artincam

# go to camera folder in artincam repo
cd /opt/artincam/camera

# run the preview.py file
uv run preview.py
```

## Updating repo to its latest
```shell
cd /opt/artincam
git pull
cd camera
uv sync --all-extras
```
