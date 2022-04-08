import os

from config.base_config import Config


class ProdConfig(Config):
    BASE_URL = os.getenv('BASE_URL')
    QR_SCALE = int(os.getenv('QR_SCALE'))
    SECRET_KEY = ''
