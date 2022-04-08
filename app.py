import atexit
import datetime
import logging
import os
import sqlite3
import sys
import uuid

import jwt
import psycopg
from flask import Flask, render_template, request, make_response, Response
from google.auth.transport import requests
from google.oauth2 import id_token

import qr_code
from db_client import DbClient
from models.code import Code

app = Flask(__name__)
app.logger.addHandler(logging.StreamHandler(sys.stdout))
app.logger.setLevel(logging.ERROR)
config = 'config.dev_config.DevConfig'
if app.config['ENV'] == 'prod':
    config = 'config.prod_config.ProdConfig'
app.config.from_object(config)

CLIENT_ID = app.config['CLIENT_ID']
BASE_URL = app.config['BASE_URL']
JWT_SECRET = app.config['SECRET']
QR_SCALE = app.config['QR_SCALE']
if QR_SCALE not in [8, 10, 12]: QR_SCALE = 12

global current_code, db
current_code = Code()

# set the db based on the env
if app.config['ENV'] == 'prod':
    connection = psycopg.connect(os.getenv('DATABASE_URL'))
else:
    connection = sqlite3.connect(app.config.get('DB_NAME', 'test.db'), check_same_thread=False)

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
    # if 'visits' in session:
    #     session['visits'] = session.get('visits') + 1
    # else:
    #     session['visits'] = 1
    query_param_code = request.args.get('code', None)
    if not query_param_code:
        return render_template('done.html', status='failed', reason='no code provided - try again')
    cookie = request.cookies.get('attendance')
    if cookie:
        try:
            user_cookie_info = jwt.decode(cookie, JWT_SECRET, algorithms=["HS256"])
            user_name = user_cookie_info["user_name"]
            date_created = user_cookie_info["date_created"].split('.')[0]
            user_time = datetime.datetime.strptime(date_created, '%Y-%m-%d %H:%M:%S')
            if user_time + datetime.timedelta(5) > datetime.datetime.now() and finish_login(user_name,
                                                                                            query_param_code):
                return render_template('done.html', status='success')
        except:
            pass
    return render_template('signin.html', code=query_param_code)


@app.route("/signin/", methods=['POST'])
def sign_in():
    """
    this is where google sends login creds
    :return:
    """
    # get request args
    user_code = request.args.get('code', None)
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

    # create jwt
    encoded = jwt.encode({"user_name": user_email, "date_created": str(datetime.datetime.now())}, JWT_SECRET,
                         algorithm="HS256")
    if finish_login(user_email, user_code):
        response = make_response(render_template('done.html', status='success'))
    else:
        response = make_response(render_template('done.html', status='failed', reason='code expired - try again'))
    response.set_cookie("attendance", encoded, samesite='Lax')
    # response.cache_control.no_cache = True
    return response


@app.route("/code/", methods=['GET'])
def code():
    """
    this is where the qr code is displayed
    TODO: put this behind a login. this logic should be behind a POST endpoint that is the redirect
    TODO: of a google login. this GET endpoint should render the google button page
    :return:
    """
    cookie = request.cookies.get('attendance')
    able_to_access = False
    if cookie:
        try:
            user_cookie_info = jwt.decode(cookie, JWT_SECRET, algorithms=["HS256"])
            user_name = user_cookie_info["user_name"].split('@')[0]
            if user_name == 'baierpa':
                able_to_access = True
        except:
            pass
    if able_to_access:
        global current_code
        new_code = str(uuid.uuid4())
        qr_code.generate_qr(new_code, f'{BASE_URL}signin', QR_SCALE)
        db.insert_code(new_code)
        current_code = Code(new_code, datetime.datetime.utcnow(), os.getenv('CODE_REFRESH_RATE'))
        return render_template('code.html')
    else:
        return Response("403 Forbidden", status=403, mimetype='text/plain')


def code_is_valid(value):
    global current_code, db
    if current_code.is_empty() or current_code.is_expired():
        current_code = db.get_code()
        current_code.set_ttl(os.getenv('CODE_REFRESH_RATE'))
    return current_code.is_valid(value)


def finish_login(user, user_code):
    # check that the code is valid
    if app.config['ENV'] == 'prod' and not code_is_valid(user_code):
        return False

    # add user to attendance table
    db.add_user_attendance(user)
    return True
