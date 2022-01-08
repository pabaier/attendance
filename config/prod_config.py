import os

from config.base_config import Config


class ProdConfig(Config):
    BASE_URL = os.getenv('BASE_URL')
    SECRET_KEY = ''
