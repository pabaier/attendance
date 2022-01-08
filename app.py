import atexit
import datetime
import os
import sqlite3
import uuid
import psycopg

from flask import Flask, render_template, request, session
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

CLIENT_ID = app.config['CLIENT_ID']
BASE_URL = app.config['BASE_URL']

global current_code, db
current_code = Code()

# set the db based on the env
if app.config['ENV'] == 'prod':
    connection = psycopg.connect(os.getenv('DATABASE_URL'))
else:
    db_name = 'attendance.db'
    connection = sqlite3.connect(db_name, check_same_thread=False)

db = DbClient(connection)


def close_db():
    global db
    print('closing db connection...')
    db.con.close()


atexit.register(close_db)


@app.route("/signin/", methods=['GET'])
def home():
    """
    this is where the QR code sends users
    :return:
    """
    if 'visits' in session:
        session['visits'] = session.get('visits') + 1
    else:
        session['visits'] = 1
    query_param_code = request.args.get('code', None)
    if not query_param_code:
        return render_template('done.html', status='failed', reason='no code provided - try again', )
    return render_template('signin.html', code=query_param_code, visits=session['visits'])


@app.route("/signin/", methods=['POST'])
def sign_in():
    """
    this is where google sends login creds
    :return:
    """
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


@app.route("/code/", methods=['GET'])
def code():
    """
    this is where the qr code is displayed
    TODO: put this behind a login. this logic should be behind a POST endpoint that is the redirect
    TODO: of a google login. this GET endpoint should render the google button page
    :return:
    """
    global current_code
    new_code = str(uuid.uuid4())
    qr_code.generate_qr(new_code, f'{BASE_URL}signin')
    db.insert_code(new_code)
    current_code = Code(new_code, datetime.datetime.utcnow())
    return render_template('code.html')


def code_is_valid(value):
    global current_code, db
    if current_code.is_empty() or current_code.is_expired():
        current_code = db.get_code()
    return current_code.is_valid(value)
