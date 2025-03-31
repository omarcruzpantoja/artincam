#!/bin/bash

# Path to the JSON file
CAMERA_DIRECTORY="$(dirname "$(dirname "$(realpath "$0")")")"
JSON_FILE="$CAMERA_DIRECTORY/artincam/config/config.json"

# Prompt the user for a new pi_id
echo -n "Current pi_id: "
python3 $CAMERA_DIRECTORY/support/show_config.py camera.pi_id

echo -n "Enter new pi_id: "
read NEW_ID

# Call the Python script to update the pi_id
python3 $CAMERA_DIRECTORY/support/update_config.py "$JSON_FILE" "camera.pi_id" "$NEW_ID"
