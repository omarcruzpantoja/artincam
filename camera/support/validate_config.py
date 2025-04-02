#!/usr/bin/env python3

import json
import pathlib

from jsonschema import ValidationError, validate


def load_json(file_path):
    """Load JSON data from a file."""
    with open(file_path, "r") as file:
        return json.load(file)


def validate_json(json_data, schema_data):
    """Validate JSON data against a JSON schema."""
    try:
        validate(instance=json_data, schema=schema_data)
        print("✅ Configuration is valid!")
    except ValidationError as e:
        if description := e.schema.get("description"):
            message = f"Invalid value ({e.instance}). {description}"
        else:
            message = e.message
        print(f"❌ Configuration validation failed ({'->'.join(e.path)}): {message}")


def main():
    """Load and validate the JSON file."""
    CAMERA_DIRECTORY = pathlib.Path(__file__).resolve().parent.parent
    CONFIG_PATH = CAMERA_DIRECTORY / "artincam" / "config" / "config.json"
    CONFIG_SCHEMA_PATH = CAMERA_DIRECTORY / "artincam" / "config" / "config_schema.json"
    json_data = load_json(CONFIG_PATH)
    schema_data = load_json(CONFIG_SCHEMA_PATH)
    validate_json(json_data, schema_data)


if __name__ == "__main__":
    main()
