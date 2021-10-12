from config.base_config import Config

class ProdConfig(Config):
    BASE_URL = ''
    SECRET_KEY = ''
    CODE_REFRESH_RATE = '10'
