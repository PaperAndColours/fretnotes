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

function semitonesToNoteFull(note) {
		return {
		0: "C",
		1: "C#",
		2: "D",
		3: "D#",
		4: "E",
		5: "F",
		6: "F#",
		7: "G",
		8: "G#",
		9: "A",
		10: "A#",
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
	this.init = function() {
		if (typeof(name)=="string") {
			var re_validInterval = /^[b#]*\d+[<>]?$/;
			assert(re_validInterval.test(name), "Invalid interval name");
			var re_degree = name.search(/\d+/);
			var re_dir = name.search(/[<>]/);
			if (re_dir == -1) re_dir = name.length;

			this.accidentals = accidentalsToInt(name.slice(0, re_degree))
			this.degree = parseInt(name.slice(re_degree, re_dir));

			this.octave = 0;
			this.seperateOctavesDegrees();
			this.dir = name.slice(re_dir) || ">";

			this.base_semitones = degreeToSemitones(this.degree) + this.accidentals + this.octave*12;
			this.semitones =  this.base_semitones +	this.octave*12;
		}
		else if (typeof(name) =="number") {
			this.octave = 0;
			while (name>12) {
				this.octave++;
				name -= 12;
			}
			var intervals = [0, 2, 4, 5, 7, 9, 11]
			for(var i=0; i<intervals.length; i++) {
				if (name>= intervals[i]) 
					this.degree = i+1;
			}
			this.accidentals = name - this.degree +1;
			this.semitones = degreeToSemitones(this.degree) + this.accidentals + this.octave*12;
		}
	}

	this.interval = function() {
		return intToAccidental(this.accidentals) + String(this.degree + this.octave*7) +this.dir;
	}
	this.collapseOctaves = function() {
		return new Interval(intToAccidental(this.accidentals) + String(this.degree) + this.dir);
	}
	this.add = function(other) {
		assert(other instanceof Interval, "Can only add Intervals to Intervals");
		var target_degree = this.degree + other.degree -1; //+1 to account for root
		var target_semitones = this.semitones + other.semitones;
	
		var naturalref_semitones = degreeToSemitones(target_degree);
		var target_accidentals = target_semitones - naturalref_semitones;

		var target_octave = this.octave + other.octave;
		this.seperateOctavesDegrees();
		return new Interval(intToAccidental(target_accidentals) + String(target_degree));

	}
	this.sub = function(other) {
		assert(interval instanceof Interval, "Can only subtract Intervals from Intervals");
		var target_degree = this.degree - other.degree +1;
		var target_semitones = this.semitones - other.semitones;
	
		var naturalref_semitones = degreeToSemitones(target_degree);
		var target_accidentals = target_semitones - natural_semitones;

		var target_octave = this.octave + other.octave;
		var target = new Interval(intToAccidental(target_accidentals) + String(target_degree))
		return target;
	}
	this.invert = function() {
	}
	this.switchDir = function() {
	}

	this.seperateOctavesDegrees = function() {
		while (this.degree > 7) {
			this.octave++;
			this.degree -= 7;
		}
		while (this.degree < 1) {
			this.octave--;
			this.degree += 7;
		}
	}
	this.init();
};


function Note(note) {
	if (typeof(note) == "string") {
		var re_validNote = /[A-G][b#]*[-]?\d$/;
		var re_octave = note.search(/[-]?\d+/);

		assert(re_validNote.test(note), "Invalid note name " + note);
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
		assert(interval instanceof Interval, "Can only subtract Intervals to Notes");
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
}

