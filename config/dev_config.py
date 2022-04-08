from config.base_config import Config


class DevConfig(Config):
    BASE_URL = 'http://localhost:5000/'
    SECRET_KEY = 'abc123'
    DB_NAME = 'test.db'
    QR_SCALE = 10
