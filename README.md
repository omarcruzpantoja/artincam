# Artincam project

## Setting up PI for the first time

1. Turn on VNC server using ssh connection
  ```bash
  sudo raspi-config

  # Select Interface Options
  # Select VNC
  # Yes
  # Finish
  ```

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
4. Run all the commands in init_pi.sh
5. Change configuration of the raspberry pi
   ```shell
   cd /opt/artincam/camera
   uv run support/edit_config.py
   ```


### TODO: 
- add instructions for transfering files
- add instructions for turning on camera
- add instructions for turning off camera
- add instructions to show config
- add instructions for bluetooth connection
- add instructions for ssh connection