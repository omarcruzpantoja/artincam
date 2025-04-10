# Artincam Camera

## Overview
This project uses the Raspberry Pi Camera Module with picamera2 to capture images and videos. The camera supports configurable settings such as resolution, framerate, bitrate, and recording duration. This README provides a summary of the configuration parameters used in the script.

## Configuration Parameters

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
| images_per_cycle | Number of images taken per cycle. ( this is only used on image/video mode )|
| image_rest_time  | Time (in seconds) between image captures. |
| image_time_unit  | Unit of time for image capture intervals (s, m, h, d). |

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

## File Naming Format
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

## Running the Camera

Place your configuration file in config/config.json (there is one already by default).

Run the script:

python3 main.py

## Notes

The script automatically adjusts time units (seconds, minutes, hours, days) based on the configuration.

If the output directory does not exist, it should be created before running the script.

For any issues, refer to the official picamera2 documentation.

