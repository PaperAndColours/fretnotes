# coding=utf-8
from app import db, Role, User, roles_users, app, user_datastore
from datetime import date, datetime
from flask_security.utils import encrypt_password

import string
import random
print "Enter password:"
admin_pw = raw_input()
with app.app_context():
	user_role = Role(name='user')
	super_user_role = Role(name='superuser')
	db.session.add_all([user_role, super_user_role])

	test_user = user_datastore.create_user(
		first_name="Admin",
		email="admin",
		password=encrypt_password(admin_pw),
		roles=[user_role, super_user_role]
	)
	db.session.commit()
