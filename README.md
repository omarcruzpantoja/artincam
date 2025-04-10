# Artincam project

## Setting up PI for the first time

1. Turn on VNC server using ssh connection (LAN cable connection using `zacpi.local` hostname)

   Run the following commands and options in the terminal:
      * sudo raspi-config
      * Select Interface Options
      * Select VNC
      * Yes
      * Finish

   This will turn on VNC server. Once this is ready, using VNC Viewer connect with the raspberry's hostname
   For example: zacpi.local
   You will be prompted a username/password.

   If using LAN cable to connect, first make sure to add a static IP by editing connection and setting an IP in IPv4 tab.
   Example IP and Mask: 192.168.0.101 / 24 


2. Establish WIFI connection (internet) to download latest updates and all the dependencies for the project

3. Clone the repo
   ```shell
   git clone https://github.com/omarcruzpantoja/artincam.git
   cd artincam
   ```
4. Run all the commands in `init_pi.sh`
   * Make sure all commands succeed

5. Change camera configuration of the raspberry pi
   ```shell
   cd /opt/artincam/camera
   uv run support/edit_config.py
   ```

## Transfering files from output directory to usb stick
```shell
# change directory to artincam repo, camera folder
cd /opt/artincam/camera

# run command to initiate transfer file
uv run support/transfer_files

# If there is a usb stick to transfer files to, you should be prompted with the option to choose a usb to transfer data to. Choose from the list (1 through X number of devices)

# Confirm that your selection is correct with Y or YES or y or yes

# Stop the transfer at any point by pressing and holding the letter q for 3 seconds. This will gracefully stop the transfer, once the current transfer is finished, the process will be stopped.
```

## Artincam service commmands

### Check status of the service
```shell
sudo systemctl status artincam
```

### Start the camera
```shell
sudo systemctl start artincam
```

### Stop the camera
```shell
sudo systemctl start artincam
```

## Camera configuration commands

### Display current camera config values
```shell
cd /opt/artincam/camera
uv run support/show_config.py
```

### Edit camera config values
```shell
cd /opt/artincam/camera
uv run support/edit_config.py
```

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
---
#### Todo in google drive (most likely)
- add instructions for bluetooth connection
- add instructions for ssh connection