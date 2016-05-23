from app import Shape, Scale, ScaleFormula, ExerciseTemplate, Exercise, PractiseSession, Role, User
from app import db
from datetime import datetime

session = db.session


g_Shape = Shape(name="G Shape", base_string="0", all_frets_above=0, all_frets_below=3)
c_Shape = Shape(name="C Shape", base_string="1", all_frets_above=0, all_frets_below=3)
a_Shape = Shape(name="A Shape", base_string="1", all_frets_above=3, all_frets_below=1)
e_Shape = Shape(name="E Shape", base_string="0", all_frets_above=2, all_frets_below=1)
d_Shape = Shape(name="D Shape", base_string="2", all_frets_above=3, all_frets_below=1)

session.add_all([g_Shape, c_Shape, a_Shape, e_Shape, d_Shape])

minor = ScaleFormula(name="minor", formula="1 2 b3 4 5 b6 b7")
major = ScaleFormula(name="major", formula="1 2 3 4 5 6 7")
session.add_all([minor, major])

a_minor = Scale(note="A", scale_formula=minor)
Cs_major = Scale(note="C#", scale_formula=major)
Eb_major = Scale(note="Eb", scale_formula=major)
session.add_all([a_minor, Cs_major, Eb_major])

exT1 = ExerciseTemplate(shape=g_Shape, scale=Eb_major, tempo=120)
ex = Exercise(exercise_template=exT1, tempo=100)
practise_session = PractiseSession(start=datetime.now(), exercises=[ex])
#session.add_all([exT1, ex, practise_session])

session.commit()
