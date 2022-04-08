import os

from config.base_config import Config


class ProdConfig(Config):
    BASE_URL = os.getenv('BASE_URL')
    QR_SCALE = os.getenv('QR_SCALE')
    CLASS_TIMES = os.getenv('CLASS_TIMES')
    OPEN_START = os.getenv('OPEN_START')
    OPEN_END = os.getenv('OPEN_END')
    SECRET_KEY = ''
