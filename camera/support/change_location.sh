#!/bin/bash

# Path to the JSON file
CAMERA_DIRECTORY="$(dirname "$(dirname "$(realpath "$0")")")"
JSON_FILE="$CAMERA_DIRECTORY/artincam/config/config.json"

# Prompt the user for a new location
echo -n "Current location: "
python3 $CAMERA_DIRECTORY/support/show_config.py camera.location

echo -n "Enter new location: "
read NEW_ID

# Call the Python script to update the location
python3 $CAMERA_DIRECTORY/support/update_config.py "$JSON_FILE" "camera.location" "$NEW_ID"
