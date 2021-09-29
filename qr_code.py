import pyqrcode

def generate_qr(code, url='http://localhost:5000/signin'):
    url = pyqrcode.create(f'{url}?code={code}')
    url.svg('static/qr.svg', scale=12, background='white')