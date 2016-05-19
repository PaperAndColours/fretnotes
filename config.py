import os
basedir = os.path.abspath(os.path.dirname(__file__))

DEBUG = True
SECRET_KEY = "development key"

SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(basedir, "db.db")
SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_MIGRATE_REPO = os.path.join(basedir, 'db_repository')


SECURITY_URL_PREFIX = "/admin"
SECURITY_PASWORD_HASH = "pdkdf2_sha512"

SECURITY_LOGIN_URL = "/login/"
SECURITY_LOGOUT_URL = "/logout/"
SECURITY_REGISTER_URL = "/register/"

SECURITY_POST_LOGIN_VIEW = "/admin/"
SECURITY_POST_LOGOUT_VIEW = "/admin/"
SECURITY_POST_REGISTER_VIEW = "/admin/"

SECURITY_REGISTERABLE = True
SECURITY_SEND_REGISTER_EMAIL = False
