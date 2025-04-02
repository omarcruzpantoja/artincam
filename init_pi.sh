#!/bin/bash

# allow ssh service to turn on automatically on boot
sudo touch /boot/ssh

# Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Go into camera folder to set up camera script
cd camera

# Create virtual environment, use system site packages to take advantage of already installed
# picamera libraries and packages
uv venv --system-site-packages

# Install "project" dependencies
uv sync --all-extras

sudo cp artincam/setup/articam.service /etc/systemd/system/artincam.service

sudo mv ~/Documents/artincam /opt/artincam
sudo chown -R $USER:$USER /opt/artincam

sudo systemctl daemon-reload
