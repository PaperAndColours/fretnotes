#character-encoding: utf-8
#Flask imports
from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash, jsonify
from contextlib import closing
from flask.ext.sqlalchemy import SQLAlchemy
from sqlalchemy.inspection import inspect
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


#----DBO Mixins -------- mx
class Serializer(object):
    def serialize(self):
        return {c: getattr(self, c) for c in inspect(self).attrs.keys()}

    @staticmethod
    def serialize_list(l):
        return [m.serialize() for m in l]

#------DB Objects----- dbo
len_v_short = 8;
len_short = 32;

shapes_users = db.Table(
	'shapes_users',
	db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
	db.Column('shape_id', db.Integer(), db.ForeignKey('shape.id')),
)

scales_users = db.Table(
	'scales_users',
	db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
	db.Column('scale_id', db.Integer(), db.ForeignKey('scale.id')),
)

exercise_templates_users = db.Table(
	'exercise_templates_users',
	db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
	db.Column('exercise_template_id', db.Integer(), db.ForeignKey('exercise_template.id')),
)

exercises_users = db.Table(
	'exercises_users',
	db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
	db.Column('exercise_id', db.Integer(), db.ForeignKey('exercise.id')),
)

practise_sessions_users = db.Table(
	'practise_sessions_users',
	db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
	db.Column('practise_session_id', db.Integer(), db.ForeignKey('practise_session.id')),
)

roles_users = db.Table(
	'roles_users',
	db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
	db.Column('role_id', db.Integer(), db.ForeignKey('role.id')),
)

class Shape(db.Model, Serializer):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(len_short), nullable=False);
	base_string = db.Column(db.Integer, nullable=False);
	
	all_frets_above = db.Column(db.Integer)
	all_frets_below = db.Column(db.Integer)
	single_frets_above = db.Column(db.String)
	single_frets_below = db.Column(db.String)


class Scale(db.Model, Serializer):
	id = db.Column(db.Integer, primary_key=True)
	note = db.Column(db.String(len_v_short), nullable=False)

	scale_formula_id = db.Column(db.Integer, db.ForeignKey('scale_formula.id'))
	scale_formula = db.relationship("ScaleFormula")

class ScaleFormula(db.Model, Serializer):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(len_short), nullable=False);
	formula = db.Column(db.String(len_short), nullable=False);

class ExerciseTemplate(db.Model, Serializer):
	id = db.Column(db.Integer, primary_key=True)
	tempo = db.Column(db.Integer, nullable=False)
	target_length = db.Column(db.Integer)

	scale_id = db.Column(db.Integer, db.ForeignKey('scale.id'))
	shape = db.relationship('Shape')
	shape_id = db.Column(db.Integer, db.ForeignKey('shape.id'))
	scale = db.relationship('Scale')

class Exercise(db.Model, Serializer):
	id = db.Column(db.Integer, primary_key=True)
	tempo = db.Column(db.Integer)
	target_length = db.Column(db.Integer)
	length = db.Column(db.Integer)
	started = db.Column(db.Boolean, default=0)
	completed = db.Column(db.Boolean, default=0)

	exercise_template_id = db.Column(db.Integer, db.ForeignKey('exercise_template.id'))
	exercise_template = db.relationship("ExerciseTemplate")
	practise_session_id = db.Column(db.Integer, db.ForeignKey('practise_session.id'))

	def serialize(self):
		data = Serializer.serialize(self)
		del data['users']
		data['exercise_template'] = Serializer.serialize(data['exercise_template'])
		del data['exercise_template']['users']
		data['exercise_template']['scale'] = Serializer.serialize(data['exercise_template']['scale'])
		del data['exercise_template']['scale']['users']
		data['exercise_template']['scale']['scale_formula'] = Serializer.serialize(data['exercise_template']['scale']['scale_formula'])
		data['exercise_template']['shape'] = Serializer.serialize(data['exercise_template']['shape']) 
		del data['exercise_template']['shape']['users']

		#Perhaps re-add later, removing now to keep things simple:
		del data['exercise_template_id']
		del data['id']
		del data['exercise_template']['id']
		del data['exercise_template']['scale_id']
		del data['exercise_template']['scale']['id']
		del data['exercise_template']['scale']['scale_formula_id']
		del data['exercise_template']['scale']['scale_formula']['id']
		del data['exercise_template']['shape']['id']
		del data['exercise_template']['shape_id']
		del data['practise_session_id']

		print data
		return data
	
class PractiseSession(db.Model, Serializer):
	id = db.Column(db.Integer, primary_key=True)
	start = db.Column(db.DateTime, nullable=False)

	exercises = db.relationship('Exercise')


class Role(db.Model, RoleMixin, Serializer):
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

	shapes = db.relationship('Shape', secondary=shapes_users, backref=db.backref('users', lazy='dynamic'))
	scale_formulas = db.relationship('Scale', secondary=scales_users, backref=db.backref('users', lazy='dynamic'))
	exercise_templates = db.relationship('ExerciseTemplate', secondary=exercise_templates_users, backref=db.backref('users', lazy='dynamic'))
	exercises = db.relationship('Exercise', secondary=exercises_users, backref=db.backref('users', lazy='dynamic'))
	practise_sessions = db.relationship('PractiseSession', secondary=practise_sessions_users, backref=db.backref('users', lazy='dynamic'))

	def __str__(self):
		return self.email
	
#Shape Scale ScaleFormula ExerciseTemplate Exercise PractiseSession
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


admin.add_view(MyModelView(Shape, db.session))
admin.add_view(MyModelView(PractiseSession, db.session))
admin.add_view(MyModelView(Exercise , db.session))
admin.add_view(MyModelView(ExerciseTemplate , db.session))
admin.add_view(MyModelView(ScaleFormula , db.session))
admin.add_view(MyModelView(Scale , db.session))
admin.add_view(MyModelView(Role, db.session))
admin.add_view(MyModelView(User, db.session))

#------Routing----- ro
@app.route('/')
def index():
	return render_template("main.html")

@app.route('/exercise')
def exercise():
	return render_template("exercise.html")

@app.route('/json/exercise/<id>')
def ajax_exercise(id):
	exercise = db.session.query(Exercise).filter(Exercise.id==id).join(ExerciseTemplate).join(Shape).join(Scale).join(ScaleFormula).one()

	t = exercise.exercise_template
	shape = t.shape
	scale = t.scale


	#name = db.Column(db.String(len_short), nullable=False);
	#base_string = db.Column(db.Integer, nullable=False);
	
	#all_frets_above = db.Column(db.Integer)
	#all_frets_below = db.Column(db.Integer)
	#single_frets_above = db.Column(db.String)
	#single_frets_below = db.Column(db.String)

	json = jsonify(exercise.serialize())
	return json

@app.route('/login')
def login():
	redirect(url_for(security.login))

@app.route('/logout')
def logout():
	redirect(url_for(security.logout))


if __name__ == '__main__':
	app_dir = osp.realpath(osp.dirname(__file__))
	app.run(debug=True)
