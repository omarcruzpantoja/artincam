#!/bin/bash

# Update PI's packages to latest
sudo apt update
sudo apt upgrade

# allow ssh service to turn on automatically on boot
sudo touch /boot/ssh

# Get current user
CURRENT_USER=$(whoami)

# Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Restart bash so uv is installed
source ~/.bashrc

# Go into camera folder to set up camera script
cd camera

# Create virtual environment, use system site packages to take advantage of already installed
# picamera libraries and packages
uv venv --system-site-packages

# Install "project" dependencies
uv sync --all-extras

# Path to the service file
SERVICE_FILE="setup/artincam.service"

# Replace the User field in the service file
sed -i "s/^User=.*/User=$CURRENT_USER/" "$SERVICE_FILE"

sudo cp $SERVICE_FILE /etc/systemd/system/artincam.service

sudo mv ~/artincam /opt/artincam
sudo chown -R $USER:$USER /opt/artincam

# ---- Set up Blueooth ----
cd ../
bash ./bluetooth_setup.sh

sudo systemctl daemon-reload

git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
