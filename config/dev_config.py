from config.base_config import Config


class DevConfig(Config):
    BASE_URL = 'http://localhost:5000/'
    SECRET_KEY = 'abc123'
