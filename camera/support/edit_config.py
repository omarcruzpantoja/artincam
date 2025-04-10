#!/usr/bin/env python3
import json
import pathlib
from jsonschema import ValidationError, validate

CAMERA_DIRECTORY = pathlib.Path(__file__).resolve().parent.parent
CONFIG_FILE = CAMERA_DIRECTORY / "artincam" / "config" / "config.json"
CONFIG_SCHEMA_PATH = CAMERA_DIRECTORY / "artincam" / "config" / "config_schema.json"


def save_config(config: dict) -> None:
    """Save the configuration to a file after validating it."""
    schema_data = load_json(CONFIG_SCHEMA_PATH)
    if not validate_json(config, schema_data):
        return

    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(config, f, indent=2)
        print("\n✔ Configuration updated and saved to config.json")
    except IOError as e:
        print(f"Error writing to {CONFIG_FILE}: {e}")


def prompt_update(config: dict) -> None:
    """Prompt the user to update the configuration."""

    def traverse(node, path=[], section=None) -> None:
        if isinstance(node, dict):
            for key, value in node.items():
                sub_section = key if section is None else section
                traverse(value, path + [key], sub_section)
        elif isinstance(node, list):
            for i, value in enumerate(node):
                traverse(value, path + [str(i)], section)
        else:
            display_prompt(path, node, config)

    last_section = [None]

    def display_prompt(path: list, current_value, root_config: dict) -> None:
        section_name = path[0]
        if last_section[0] != section_name:
            print(f"\n[ {section_name} ]")
            last_section[0] = section_name

        key_label = ".".join(path)
        key_display = f"  {key_label:<25}= {str(current_value):<10}"
        user_input = input(f"{key_display} → Enter new value (leave blank to keep): ").strip()

        if user_input != "":
            try:
                new_value = (
                    type(current_value)(eval(user_input))
                    if isinstance(current_value, (int, float, bool))
                    else type(current_value)(user_input)
                )
            except (ValueError, SyntaxError):
                print(f"Invalid input: {user_input}. Keeping original value.")
                new_value = current_value
            assign(root_config, path, new_value)

    def assign(cfg: dict, path: list, value) -> None:
        for key in path[:-1]:
            cfg = cfg[int(key)] if key.isdigit() else cfg[key]
        last_key = path[-1]
        if last_key.isdigit():
            cfg[int(last_key)] = value
        else:
            cfg[last_key] = value

    print("---- Editing Configuration ----")
    traverse(config)


def load_json(file_path: pathlib.Path) -> dict:
    """Load JSON data from a file."""
    try:
        with open(file_path, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return {}
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from {file_path}: {e}")
        return {}


def validate_json(json_data: dict, schema_data: dict) -> bool:
    """Validate JSON data against a JSON schema."""
    try:
        validate(instance=json_data, schema=schema_data)
        print("✅ Configuration is valid!")
    except ValidationError as e:
        if description := e.schema.get("description"):
            message = f"Invalid value ({e.instance}). {description}"
        else:
            message = e.message
        print(
            f"❌ Configuration validation failed ({'->'.join(str(p) for p in e.path)}): {message}\nConfiguration changes not saved."
        )
        return False
    return True


def main() -> None:
    config = load_json(CONFIG_FILE)
    prompt_update(config)
    save_config(config)


if __name__ == "__main__":
    main()
