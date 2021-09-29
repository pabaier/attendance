import atexit
import datetime
import uuid

from flask import Flask
from flask import render_template
from flask import request
from google.auth.transport import requests
from google.oauth2 import id_token

import qr_code
from db_client import DbClient
from models.code import Code

app = Flask(__name__)
config = 'config.dev_config.DevConfig'
if app.config['ENV'] == 'prod':
    config = 'config.prod_config.ProdConfig'
app.config.from_object(config)

print(app.config['DB_SERVER'])
CLIENT_ID = app.config['CLIENT_ID']
print(app.config.keys())
print(app.config.values())
global current_code, db
current_code = Code()
db = DbClient()


def close_db():
    global db
    db.con.close()


atexit.register(close_db)


@app.route("/signin/", methods=['GET'])
def home():
    return render_template('signin.html', code=request.args['code'])


@app.route("/code/", methods=['GET'])
def code():
    global current_code
    new_code = str(uuid.uuid4())
    qr_code.generate_qr(new_code, 'http://10.5.207.96:5000/signin')
    db.insert_code(new_code)
    current_code = Code(new_code, datetime.datetime.utcnow())
    return render_template('code.html')


@app.route("/signin/", methods=['POST'])
def sign_in():
    # get request args
    user_code = request.args['code']
    token = request.form['credential']

    # verify the user credentials
    id_info = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)

    # get the email, org, and client id from the verfied user
    user_email = id_info['email']
    user_org = id_info['hd']
    returned_client_id = id_info['aud']

    # check if user is is part of org
    if not user_org == 'g.cofc.edu' or not returned_client_id == CLIENT_ID:
        return render_template('done.html', status='failed', reason='please use your cofc account - try again')

    # check that the code is valid
    if not code_is_valid(user_code):
        return render_template('done.html', status='failed', reason='invalid code - try again', )

    # add user to attendance table
    db.add_user_attendance(user_email)

    return render_template('done.html', status='success')


def code_is_valid(value):
    global current_code, db
    if current_code.is_empty() or current_code.is_expired():
        current_code = db.get_code()
    return current_code.is_valid(value)
