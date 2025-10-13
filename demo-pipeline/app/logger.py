import logging
import sys
import time

logging.Formatter.converter = time.gmtime

# Get logger instance
logger = logging.getLogger()

# Create formatter
formatter = logging.Formatter(
  fmt="%(asctime)s | %(levelname)s | %(message)s"
)

# Create handlers 
stream_handler = logging.StreamHandler(sys.stdout)
file_handler = logging.FileHandler('../app.log')

# Set formatter
stream_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)

# Add handlers to logger instance
logger.handlers = [stream_handler, file_handler]

# Set log-level
logger.setLevel(logging.DEBUG)