import argparse
import json


def update_json_file(file_path, key_path, new_value):
    """
    Update a specific key in a nested JSON file and overwrite the file with the updated content.

    :param file_path: Path to the JSON file
    :param key_path: Dot-separated key path (e.g., "camera.resolution.height")
    :param new_value: New value to set
    """
    try:
        with open(file_path, "r") as file:
            data = json.load(file)

        keys = key_path.split(".")
        obj = data
        for key in keys[:-1]:
            obj = obj[key]  # Traverse to the correct dictionary level
        obj[keys[-1]] = new_value  # Set the new value

        with open(file_path, "w") as file:
            json.dump(data, file, indent=2)

        print(f"Successfully updated {key_path} to {new_value}.")
    except (FileNotFoundError, KeyError, json.JSONDecodeError) as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Update a value in a JSON file.")
    parser.add_argument("file", help="Path to the JSON file")
    parser.add_argument("key", help="Dot-separated key path (e.g., 'camera.resolution.height')")
    parser.add_argument("value", help="New value to set")

    args = parser.parse_args()

    # Convert value to int if possible
    try:
        new_value = int(args.value)
    except ValueError:
        new_value = args.value

    update_json_file(args.file, args.key, new_value)
