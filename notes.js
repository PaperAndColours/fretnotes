/*Notes
-----
NoteClass
Note without octave, abstract, theoretical representation
A, B, C#, Db


Note
Note with a pitch, can be played
A5, G2, C4, Bb5


Collections
-----------
Scale
Collection of NoteClass objets

Range
Collection of Note objects


Will I even need that? I could just go from the highest to the lowest on guitar, and then filter according to position. I will probably need a seperate scale object, from which a range can be generated.


Define pitch class -> [A, Bb, C, D, E, F, G] (A phrygian)
	Generate from:
		tonic: A
		scale (1, b2, b3, 4, 5, b6, b7)

Define shape, position -> {G shape} {rising symetrical shape}

--
New idea: ALL notes have a pitch
Note
	/[A-G][#b]*\d/

ScaleFormula is basically the same
	Intervals
Interval is basically the same

PitchRange (or perhaps just call it a scale)
	Starting note: (e.g.) E2
	Ending note: C#6
	ScaleFormula

	*Will have to travel through octaves, to make up pitches to target note*


*/

function assert(condition, message) {
	if (!condition) {
		throw message || "Assertion failed";
	}
}
function getModifier(mod_string) {
	var modifier = 0;
	for (var i=0; i<mod_string.length; i++) {
		if (mod_string[i] == "b") modifier--;
		if (mod_string[i] == "#") modifier++;
	}
	return modifier;
};

function Interval(name) {
	this.name = name;
	var re_validInterval = /^[b#]*\d+$/;
	assert(re_validInterval.test(name), "Invalid interval name");

	var degrees_semitones = { 
		1: 0,
		2: 2,
		3: 4,
		4: 5,
		5: 7,
		6: 9,
		7: 11
	};
	var degree_start = this.name.search(/\d+$/);
	var modifiers = this.name.slice(0, degree_start);
	this.degree = parseInt(this.name.slice(degree_start));
	var base_semitones = degrees_semitones[this.degree];

	var modifier = getModifier(modifiers);
	this.semitones = base_semitones + modifier;
};



function ScaleFormula(interval_list) {
	assert(typeof(interval_list) == "string", "ScaleFormula must take a string for now")
	interval_list = interval_list.split(" ");
	this.intervals = [];
	for (var i=0; i< interval_list.length; i++) {
		this.intervals.push(new Interval(interval_list[i]));
	}
}

function Note(note) {
	if (typeof(note) == "string") {
		var re_validNote = /[A-G][b#]*/;
		assert(re_validNote.test(note), "Invalid note name");
		this.note = note;
		var notes_int = {
		A:0,
		B:2,
		C:3,
		D:5,
		E:7,
		F:8,
		G:10
		}
		this.note_int = (notes_int[note[0]] + getModifier(note.slice(1)))%12;
	}
	else if (typeof(note) == "number") {
		this.note_int = note % 12;
		var int_notes = {
		0: "A",
		1: "A#",
		2: "B",
		3: "C",
		4: "C#",
		5: "D",
		6: "D#",
		7: "E",
		8: "F",
		9: "F#",
		10: "G",
		11: "G#",
		};
		this.note = int_notes[this.note_int];
	}
	this.add = function(interval) {
		return new Note((this.note_int + interval.semitones)%12);
	};
}

function Scale(root, formula) {
	this.root = root;
	this.formula = formula;
	this.notes = [];
	for (var i=0; i<formula.intervals.length; i++) {
		this.notes.push(this.root.add(formula.intervals[i]));
	}
}

function GuitarString(root, frets) {
	this.root = new Note(root);
	this.frets = frets;

	this.find = function(note) {
		if (this.root.note_int > note.note_int) 
			var start_octave = 1 
		else
			var start_octave = 0
		var notes = []
		for (var i=start_octave; (note.note_int + i*12) - this.root.note_int <= this.frets; i++){
			notes.push((note.note_int + i*12) - this.root.note_int);
		}
		return notes;
	}

	this.findScale = function(scale) {
		var frets = []
		for (var i=0; i<scale.notes.length; i++) {
			frets = frets.concat(this.find(scale.notes[i]));
		}
		return frets.sort(function(a, b) {return a-b});
	};
};
