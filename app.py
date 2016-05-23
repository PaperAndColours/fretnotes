#character-encoding: utf-8
#Flask imports
from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash, jsonify
from contextlib import closing
from flask.ext.sqlalchemy import SQLAlchemy
from sqlalchemy.inspection import inspect
from sqlalchemy.sql import and_, or_, func
from sqlalchemy.sql.functions import coalesce
from sqlalchemy import between

from wtforms import Form, SelectField, BooleanField, StringField, DateField, FloatField, IntegerField, validators, ValidationError

from flask.ext.security import Security, SQLAlchemyUserDatastore, UserMixin, RoleMixin, login_required, current_user
from flask_security.utils import encrypt_password

from flask_admin import Admin
from flask_admin import helpers as admin_helpers
from flask_admin.contrib.sqla import ModelView
from flask_admin.contrib.fileadmin import FileAdmin

import os.path as osp
import datetime
from datetime import date, timedelta
from dateutils import relativedelta
import re

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
	length = db.Column(db.Integer, default=0)
	percent_completed = db.Column(db.Integer)
	completed = db.Column(db.Boolean, default=0)
	date = db.Column(db.DateTime)

	exercise_template_id = db.Column(db.Integer, db.ForeignKey('exercise_template.id'))
	exercise_template = db.relationship("ExerciseTemplate", backref="exercises")
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
		del data['exercise_template']['exercises']
		del data['exercise_template']['scale_id']
		del data['exercise_template']['scale']['id']
		del data['exercise_template']['scale']['scale_formula_id']
		del data['exercise_template']['scale']['scale_formula']['id']
		del data['exercise_template']['shape']['id']
		del data['exercise_template']['shape_id']
		del data['practise_session_id']

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

#------Forms------- fo
class ExerciseTemplateForm(Form):
	root = SelectField("Root", coerce=int)
	accidental = SelectField("Accidental", coerce=int)
	shape = SelectField("Shape", coerce=int)
	scale = SelectField("Scale", coerce=int)
	tempo = IntegerField("Tempo")

#-----Filters------- fi
@app.template_filter('note')
def note(value):
	return value[:-1]

@app.template_filter('completed')
def format_completed(value):
	if value==True:
		return "Completed"
	else:
		return ""

@app.template_filter('timer')
def format_timer(seconds):
	minutes = str(seconds / 60).zfill(2)
	seconds = str(seconds%60).zfill(2)
	return minutes + ":" + seconds

@app.template_filter('strftime')
def _jinja2_filter_datetime(date):
	return date.strftime('%H:%M %d %b %y ')	

@app.template_filter('timedelta')
def format_timedelta(target):
	now = datetime.datetime.now()
	difference = relativedelta(now, target)
	if difference.years > 0:
		if difference.years == 1:
			return "1 year ago"
		else:
			return str(difference.years) + " years ago"
	elif difference.months > 0:
		if difference.months == 1:
			return "1 month ago"
		else:
			return str(difference.months) + " months ago"
	elif difference.days > 0:
		if difference.days == 1:
			return "Yesterday"
		elif difference.days > 6:
			weeks = difference.days/7
			if weeks == 1:
				return "1 week ago"
			else:
				return str(weeks) + " weeks ago"
		else:
			return str(difference.days) + " days ago"
	elif difference.hours >0:
		if difference.hours == 1:
			return "1 hour ago"
		else:
			return str(difference.hours) + " hours ago"

	elif difference.minutes >0:
		if difference.minutes < 5:
			return "Just now"
		else:
			return str(difference.minutes) + " minutes ago"

	else: 
		return "Just now"
		

#------Routing----- ro
@app.route('/')
def index():
	return render_template("main.html")

@app.route('/exercise')
def exercise():
	return render_template("exercise.html")

@app.route('/makeExercise/<int:template_id>')
def makeExercise(template_id):
	template = db.session.query(ExerciseTemplate).filter(ExerciseTemplate.id==int(template_id)).one()
	exercise = Exercise(exercise_template=template, tempo=template.tempo, date=datetime.datetime.now(), percent_completed=0)
	db.session.add(exercise)
	db.session.commit()
	session['exercise_id'] = exercise.id
	return redirect(url_for('practise'))

@app.route('/continueExercise/<int:exercise_id>')
def continueExercise(exercise_id):
	session['exercise_id'] = int(exercise_id)
	return redirect(url_for('practise'))

@app.route('/practise')
def practise():
	return render_template("exercise.html", exercise_id=session['exercise_id'])

def printDict(source, indent=0):
	idict = dict(source)
	for key, arg in idict.iteritems():
		if hasattr(arg, '__getitem__'):
			return printDict(arg, indent+1)
		else:
			print "\t"*indent, key, arg

	
roots = ["A", "B", "C", "D", "E", "F", "G"]
accidentals = ["", "#", "b"]
@app.route('/design', methods=["POST", "GET"])
def design():
	form = ExerciseTemplateForm()
	form.process(request.form)
	form.root.choices=[(0, "A"), (1, "B"), (2, "C"), (3, "D"), (4,"E"), (5, "F"), (6, "G")]
	form.accidental.choices=[(0, ""), (1, "#"), (2, "b")]
	form.shape.choices=db.session.query(Shape.id, Shape.name)
	form.scale.choices=db.session.query(ScaleFormula.id, ScaleFormula.name)
 
	if request.method=="POST" and form.validate():
		shape = db.session.query(Shape).filter(Shape.id==int(form.shape.data)).one()
		scaleFormula = db.session.query(ScaleFormula).filter(ScaleFormula.id==int(form.scale.data)).one()
		note = roots[form.root.data]+accidentals[form.accidental.data]+"2"
		scale = Scale(scale_formula = scaleFormula, note=note)
		exercise_template = ExerciseTemplate(tempo=form.tempo.data, scale=scale, shape=shape)
		db.session.add(scale)
		db.session.add(exercise_template)
		db.session.commit()
	templates = db.session.query(ExerciseTemplate).join(Shape).join(Scale).join(ScaleFormula).outerjoin(Exercise).all()
	return render_template("design.html", form=form, exercise_templates=templates)

@app.route('/json/exercise/<id>', methods=["POST", "GET"])
def ajax_exercise(id):
	if request.method=="GET":
		exercise = db.session.query(Exercise).filter(Exercise.id==id).join(ExerciseTemplate).join(Shape).join(Scale).join(ScaleFormula).one()
		json = jsonify(exercise.serialize())
		return json
	elif request.method=="POST":
		length = request.form.getlist('updateLength')
		completed = request.form.getlist('completed')

		exercise = db.session.query(Exercise).filter(Exercise.id==id).one()
		exercise.length = int(length[0])
		exercise.completed = [u'false', u'true'].index(completed[0])
		db.session.add(exercise)
		db.session.commit()
		return jsonify({'status': "complete"})

@app.route('/login')
def login():
	redirect(url_for(security.login))

@app.route('/logout')
def logout():
	redirect(url_for(security.logout))


if __name__ == '__main__':
	app_dir = osp.realpath(osp.dirname(__file__))
	app.run(debug=True)
