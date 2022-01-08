import os


class Config(object):
    CLIENT_ID = "274437993487-186tmakn0ltmafu7sirjgfa5ui6lfbup.apps.googleusercontent.com"
    CODE_REFRESH_RATE = os.getenv('CODE_REFRESH_RATE', '10')
