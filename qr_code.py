import pyqrcode


def generate_qr(code, url, scale=None):
    if not scale:
        scale = 12
    url = pyqrcode.create(f'{url}?code={code}')
    url.svg('static/qr.svg', scale=scale, background='white')
