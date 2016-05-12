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


New features:
	Some way to save notes enharmonically corectly
	But also simplify crazy definitions #b#b# at the same time
	Perhaps related to the scale - keep a parent reference?

*/

function assert(condition, message) {
	if (!condition) {
		throw message || "Assertion failed";
	}
}
function accidentalsToInt(mod_string) {
	var accidentals = 0;
	for (var i=0; i<mod_string.length; i++) {
		if (mod_string[i] == "b") accidentals--;
		if (mod_string[i] == "#") accidentals++;
	}
	return accidentals;
};

function intToAccidental(mod_int) {
	if (mod_int >6) mod_int -= 12;
	if (mod_int < -6) mod_int += 12;
	var accidentals = "";
	if (mod_int > 0) {
		for (var i=0; i<mod_int; i++) {
			accidentals += "#";
		}
	}
	else if (mod_int<0) {
		for (var i=0; i>mod_int; i--) {
			accidentals+= "b";
		}
	}
	return accidentals;
};

function noteToSemitones(note) {
		return {
		C:0,
		D:2,
		E:4,
		F:5,
		G:7,
		A:9,
		B:11
		}[note];
}


function semitonesToNote(note) {
		return {
		0: "C",
		2: "D",
		4: "E",
		5: "F",
		7: "G",
		9: "A",
		11: "B",
		}[note];
}

function degreeToSemitones(note) {
		return {
		1:0,
		2:2,
		3:4,
		4:5,
		5:7,
		6:9,
		7:11
		}[note];
}

function noteToInt(note) {
		return {
		C:1,
		D:2,
		E:3,
		F:4,
		G:5,
		A:6,
		B:7
		}[note];
}
function intToNote(i) {
		while (i>7) i-= 7;
		while (i<1) i+= 7;
		return {
		1:'C',
		2:'D',
		3:'E',
		4:'F',
		5:'G',
		6:'A',
		7:'B'
		}[i];
}


function Interval(name) {
	var re_validInterval = /^[b#]*\d+$/;
	var re_degree = name.search(/\d+$/);
	assert(re_validInterval.test(name), "Invalid interval name");

	this.accidentals = accidentalsToInt(name.slice(0, re_degree))
	this.degree = parseInt(name.slice(re_degree));

	this.octave = 0;
	while (this.degree > 7) {
		this.octave++;
		this.degree -= 7;
	}
	this.semitones = degreeToSemitones(this.degree) + this.accidentals + this.octave*12;

	this.interval = function() {
		return intToAccidental(this.accidentals) + String(this.degree + this.octave*7);
	}
};


function Note(note) {
	if (typeof(note) == "string") {
		var re_validNote = /[A-G][b#]*[-]?\d/;
		var re_octave = note.search(/[-]?\d+$/);
		assert(re_validNote.test(note), "Invalid note name");
		this.note_name = note[0];
		this.accidentals = accidentalsToInt(note.slice(1, re_octave));
		this.octave = parseInt(note.slice(re_octave));

		this.semitones = noteToSemitones(this.note_name) + this.accidentals + this.octave*12;

	}
	this.note = function() {
		return String(this.note_name) + intToAccidental(this.accidentals) + String(this.octave);
	}

	this._genNote = function(target_note, sum_semitones) {
		var target_octave = 0;
		while (sum_semitones >= 12) {
			target_octave++;
			sum_semitones-= 12;
		}
		while (sum_semitones < 0) {
			target_octave--;
			sum_semitones+= 12;
		}
		var degree_semitones = noteToSemitones(target_note);
		var accidentals = intToAccidental(sum_semitones - degree_semitones);
		return new Note(target_note+accidentals+target_octave);
	}

	this.add = function(interval) {
		assert(interval instanceof Interval, "Can only add Intervals to Notes");
		var target_note = intToNote(noteToInt(this.note_name) + interval.degree -1);
		var sum_semitones = this.semitones + interval.semitones;
		return this._genNote(target_note, sum_semitones);

	};
	this.sub = function(value) {
		assert(interval instanceof Interval, "Can only add Intervals to Notes");
		var interval = value;
		var target_note = intToNote(noteToInt(this.note_name) - interval.degree +1);
		var sum_semitones = this.semitones - interval.semitones;
		return this._genNote(target_note, sum_semitones);
	};
}

function ScaleFormula(interval_list) {
	assert(typeof(interval_list) == "string", "ScaleFormula must take a string for now")
	interval_list = interval_list.split(" ");
	this.intervals = [];
	for (var i=0; i< interval_list.length; i++) {
		this.intervals.push(new Interval(interval_list[i]));
	}
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
