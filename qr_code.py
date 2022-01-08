import pyqrcode


def generate_qr(code, url):
    url = pyqrcode.create(f'{url}?code={code}')
    url.svg('static/qr.svg', scale=12, background='white')
