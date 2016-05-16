#character-encoding: utf-8
#Flask imports
from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash
from contextlib import closing
from flask.ext.sqlalchemy import SQLAlchemy
from sqlalchemy.sql import and_, or_, func
from sqlalchemy.sql.functions import coalesce
from sqlalchemy import between

from flask.ext.security import Security, SQLAlchemyUserDatastore, UserMixin, RoleMixin, login_required, current_user
from flask_security.utils import encrypt_password

from flask_admin import Admin
from flask_admin import helpers as admin_helpers
from flask_admin.contrib.sqla import ModelView
from flask_admin.contrib.fileadmin import FileAdmin

import os.path as osp


app = Flask(__name__)
app.config.from_object("config")

if ('SENDGRID_USERNAME' in app.config):
	sg = sendgrid.SendGridClient(app.config['SENDGRID_USERNAME'], app.config['SENDGRID_PASSWORD'])
db = SQLAlchemy(app)


#------DB Objects----- dbo
class ImageElement(db.Model):
	id = db.Column(db.Integer, primary_key=True)

	x = db.Column(db.Integer, nullable=False)
	y = db.Column(db.Integer, nullable=False)
	width = db.Column(db.Integer, nullable=False)
	height = db.Column(db.Integer, nullable=False)

roles_users = db.Table(
	'roles_users',
	db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
	db.Column('role_id', db.Integer(), db.ForeignKey('role.id')),
)

class Role(db.Model, RoleMixin):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(80), unique=True)
	description = db.Column(db.String(255))

	def __str__(self):
		return self.name

class User(db.Model, UserMixin):
	id = db.Column(db.Integer, primary_key=True)
	first_name = db.Column(db.String(255))
	last_name = db.Column(db.String(255))
	email = db.Column(db.String(255), unique=True)
	password = db.Column(db.String(255), unique=True)
	active = db.Column(db.Boolean())
	confirmed_at = db.Column(db.DateTime())
	roles = db.relationship('Role', secondary=roles_users, backref=db.backref('users', lazy='dynamic'))

	def __str__(self):
		return self.email
	
#------Security--------- se
user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security(app, user_datastore)

@security.context_processor
def security_context_processor():
	return dict(
		admin_base_template=admin.base_template,
		admin_view=admin.index_view,
		h=admin_helpers
		)

#--------Admin---------- ad
admin = Admin(app, name="Website Guitar Home", base_template="admin_master.html", template_mode="bootstrap3")

class MyModelView(ModelView):
	def is_accessible(self):
		if not current_user.is_active or not current_user.is_authenticated:
			return False
		if current_user.has_role('superuser'):
			return True
		return False

	def handle_view(self, name, **kwargs):
		if not self.is_accessible():
			if current_user.is_authenticated:
				abort(403)
			else:
				return redirect(url_for('security.login', next=request.url))

admin.add_view(MyModelView(Role, db.session))
admin.add_view(MyModelView(User, db.session))

#------Routing----- ro
@app.route('/')
def index():
	return render_template("main.html")

@app.route('/login')
def login():
	redirect(url_for(security.login))

@app.route('/logout')
def logout():
	redirect(url_for(security.logout))


if __name__ == '__main__':
	app_dir = osp.realpath(osp.dirname(__file__))
	app.run(debug=True)
