#!/bin/bash

# Prompt the user for a Bluetooth name identifier for the Raspberry Pi
echo "Provide Bluetooth name identifier for the Pi (e.g., '1'):"
read -p "Bluetooth Name Identifier: " PRETTY_HOSTNAME

# Default to 'raspberrypi' if the user leaves it empty
if [[ -z "$PRETTY_HOSTNAME" ]]; then
  PRETTY_HOSTNAME="zacpi"
  echo "No input detected. Using default hostname: $PRETTY_HOSTNAME"
fi

# Edit /lib/systemd/system/bluetooth.service to enable Bluetooth services
echo "Configuring Bluetooth service..."
sudo sed -i 's|^ExecStart=.*toothd$| \
ExecStart=/usr/libexec/bluetooth/bluetoothd -C \
ExecStartPost=/usr/bin/sdptool add SP \
ExecStartPost=/bin/hciconfig hci0 piscan \
|g' /lib/systemd/system/bluetooth.service

# Create /etc/systemd/system/rfcomm.service to enable Bluetooth serial port from systemctl
echo "Setting up RFCOMM service..."
sudo cat <<EOF | sudo tee /etc/systemd/system/rfcomm.service >/dev/null
[Unit]
Description=RFCOMM service
After=bluetooth.service
Requires=bluetooth.service

[Service]
ExecStart=/usr/bin/rfcomm watch hci0 1 getty rfcomm0 115200 xterm -a zacpi

[Install]
WantedBy=multi-user.target
EOF

# Default to 'zacpi' if the user leaves it empty
if [[ -z "$PRETTY_HOSTNAME" ]]; then
  PRETTY_HOSTNAME="zacpi"
  echo "No input detected. Using default hostname: $PRETTY_HOSTNAME"
fi

# Update the machine-info file with the user-provided hostname
echo "Setting Bluetooth alias with: $PRETTY_HOSTNAME"
sudo busctl set-property org.bluez /org/bluez/hci0 org.bluez.Adapter1 Alias s "zacpi-$PRETTY_HOSTNAME"

# Reload systemd to apply changes
echo "Reloading systemd to apply changes..."
sudo systemctl daemon-reload

# Enable and start the Bluetooth and RFCOMM services
echo "Enabling and starting Bluetooth and RFCOMM services..."
sudo systemctl enable bluetooth.service
sudo systemctl start bluetooth.service
sudo systemctl enable rfcomm.service
sudo systemctl start rfcomm.service

echo "Configuration complete! The Raspberry Pi is now set up with Bluetooth serial service."
