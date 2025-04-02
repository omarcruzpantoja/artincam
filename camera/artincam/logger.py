import logging
import colorama

from colorama import Fore, Style

# Initialize colorama for Windows support
colorama.init()


# Custom log format with colors
class CustomFormatter(logging.Formatter):
    COLORS = {
        logging.DEBUG: Fore.MAGENTA,  # Magenta for debug
        logging.INFO: Fore.CYAN,  # Darker cyan for info
        logging.ERROR: Fore.RED,  # Red for errors
    }

    RESET = Style.RESET_ALL
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    def format(self, record):
        log_color = self.COLORS.get(record.levelno, self.RESET)
        log_message = super().format(record)
        return f"{log_color}{log_message}{self.RESET}"


# Create a logger
logger = logging.getLogger("artincam")
logger.setLevel(logging.INFO)  # Set the lowest level to capture all messages

# Create console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)  # Log everything to console

# Apply custom formatter
formatter = CustomFormatter(CustomFormatter.LOG_FORMAT)
console_handler.setFormatter(formatter)

# Add handler to logger
logger.addHandler(console_handler)

# Example Usage
# logger.debug("This is a debug message.")
# logger.info("This is an info message.")
# logger.error("This is an error message.")
