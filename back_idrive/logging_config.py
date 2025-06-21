# logging_config.py
import logging
import sys
from datetime import datetime
# Configuración de logging para la aplicación iDrive
def setup_logging(): # Function to set up logging
    """Configura el logging para la aplicación iDrive."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(f'idrive_{datetime.now().strftime("%Y%m%d")}.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )