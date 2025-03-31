#!/usr/bin/env python3
import json
import pathlib
import argparse


def get_nested_value(data, key_path):
    """Retrieve a nested value from a dictionary using a dot-separated key path."""
    keys = key_path.split(".")
    for key in keys:
        if isinstance(data, dict) and key in data:
            data = data[key]
        else:
            return None  # Key not found
    return data


def print_dict(ptr: dict, depth: int = 0):
    """Recursively prints the dictionary structure."""
    for key, value in ptr.items():
        prefix = "    " * depth
        if isinstance(value, dict):
            print(f"{prefix}{key}")
            print_dict(value, depth + 1)
        else:
            print(f"{prefix}{key}: {value}")


def main():
    CAMERA_DIRECTORY = pathlib.Path(__file__).resolve().parent.parent
    CONFIG_PATH = CAMERA_DIRECTORY / "artincam" / "config" / "config.json"

    parser = argparse.ArgumentParser(
        description="Retrieve a value from a nested JSON key or print full JSON structure."
    )
    parser.add_argument(
        "key", nargs="?", help="Dot-separated key path (e.g., 'camera.pi_id'). If not provided, prints full structure."
    )
    args = parser.parse_args()

    with open(CONFIG_PATH, "r") as file:
        config = json.load(file)

    if args.key:
        value = get_nested_value(config, args.key)
        if value is not None:
            print(value)
        else:
            print(f"Key '{args.key}' not found in JSON file.")
    else:
        print_dict(config, depth=0)


if __name__ == "__main__":
    main()
