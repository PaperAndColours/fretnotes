#!/usr/bin/python
import subprocess
import os, sys
basedir = os.path.abspath(os.path.dirname(__file__))

js_controls = "static/js/controls.js"
js_fretboard = "static/js/fretboard.js"
js_metronome = "static/js/metronome.js"
js_metronomeworker = "static/js/metronomeworker.js"
js_notes = "static/js/notes.js"
js_rendering = "static/js/rendering.js"
js_timer = "static/js/timer.js"
js_bufferloader = "static/js/bufferLoader.js"

jquery = "static/js/jquery.js"

template_exercise= "templates/exercise.html"
template_main = "templates/main.html"

db_add_user = "add_users_db.py"
app = "app.py"
config = "config.py"
db_downgrade = "downgrade_db.py"
edit = "edit.py"
db_make = "make_db.py"
db_migrate = "migrate_db.py"
requirements = "requirements.txt"
db_insert_entries = "test_entries_db.py"

def make_selection(sel_list):
	selection = ["vim"]
	for i in sel_list:
		selection.append(os.path.join(basedir, i))
	return selection


selections = {
	'change_sound': make_selection([app, template_exercise, js_metronome, js_bufferloader]),
	'all_js': make_selection([js_controls, js_fretboard, js_metronome, js_metronomeworker, js_notes, js_rendering, js_timer, js_bufferloader])
}

default = "all_js"

if (len(sys.argv)>1):
	subprocess.call(selections[sys.argv[1]])
else:
	subprocess.call(selections[default])

