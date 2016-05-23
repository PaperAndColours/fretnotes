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
		var octave = 0;
		while (note > 7){
			octave++;
			note-=7;
		}
		return {
		1:0,
		2:2,
		3:4,
		4:5,
		5:7,
		6:9,
		7:11
		}[note]+octave*12;
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
	this.init = function(name) {
		if (typeof(name)=="string") {
			var re_validInterval = /^[b#]*\d+[<>]?$/;
			assert(re_validInterval.test(name), "Invalid interval name");
			var re_degree = name.search(/\d+/);
			var re_dir = name.search(/[<>]/);
			if (re_dir == -1) re_dir = name.length;

			this.accidentals = accidentalsToInt(name.slice(0, re_degree))
			this.degree = parseInt(name.slice(re_degree, re_dir));
			this.dir = name.slice(re_dir) || ">";
			this.octave = 0;

			var octivate = this.Octivate(this.degree, this.octave);
			this.degree = octivate[0];
			this.octave = octivate[1];

		}
		else if (typeof(name) =="number") {
			var octave = 0;
			while (name>=12) {
				octave++;
				name -= 12;
			}
			var intervals_accidentals = {
				 0: [1, 0],
				 1: [2, -1],
				 2: [2, 0],
				 3: [3, -1],
				 4: [3, 0],
				 5: [4, 0],
				 6: [5, -1],
				 7: [5, 0],
				 8: [6, -1],
				 9: [6, 0],
				 10: [7, -1],
				 11: [7, 0]}[name];
		 var interval = intervals_accidentals[0] + octave*7;
		 var accidentals = intToAccidental(intervals_accidentals[1]);
		 this.init(accidentals+String(interval));
		}
	}

	this.interval = function(degree, accidentals, dir) {
		var degree = degree || this.fullDegree();
		var accidentals = accidentals || this.accidentals;
		var dir = dir || this.dir;
		return intToAccidental(accidentals) + String(degree) +dir;
	}
	this.collapseOctaves = function() {
		return new Interval(intToAccidental(this.accidentals) + String(this.degree) + this.dir);
	}
	this.add = function(other) {
		assert(other instanceof Interval, "Can only add Intervals to Intervals");
		if (this.dir != other.dir){
			return this.sub(new Interval(other.interval(undefined,undefined,this.switchDir(other.dir))));
		}
		var target_degree = this.addDegrees(this.degree, other.degree);
		var target_octave = this.octave + other.octave;
		var target_dir = this.dir;
		var octivate = this.Octivate(target_degree, target_octave);
		target_degree = octivate[0];
		target_octave = octivate[1];

		var target_semitones = this.semitones() + other.semitones();
	
		var naturalref_semitones = degreeToSemitones(target_degree);
		var target_accidentals = target_semitones - naturalref_semitones;

		target_degree += target_octave*7;
		var target_accidentals_str = intToAccidental(target_accidentals)
		return new Interval(target_accidentals_str + String(target_degree)+target_dir);

	}
	this.sub = function(other) {
		assert(other instanceof Interval, "Can only subtract Intervals from Intervals");
		if (this.dir != other.dir){
			return this.add(new Interval(other.interval(undefined,undefined,this.switchDir(other.dir))));
		}

		//work out degree
		var target_degree = this.addDegrees(this.degree, - other.degree);
		var target_octave = this.octave - other.octave;
		var target_dir = this.dir;

		var octivate = this.Octivate(target_degree, target_octave);
		target_degree = octivate[0];
		target_octave = octivate[1];

		//work out accidentals
		var target_semitones = this.semitones() - other.semitones();
		while (target_semitones<0) target_semitones+=12;

		var naturalref_semitones = degreeToSemitones(target_degree);
		var target_accidentals = target_semitones - naturalref_semitones;

		if (target_octave < 0) {
			target_octave = -target_octave - 1;
			var degAcc = this.invert(target_degree, target_accidentals);
			target_degree = degAcc[0];
			target_accidentals = degAcc[1];
			target_dir = this.switchDir(target_dir);
		}

		target_degree += target_octave*7;
		var target_accidentals_str = intToAccidental(target_accidentals)
		return new Interval(target_accidentals_str + String(target_degree)+target_dir)
	}
	this.addDegrees = function(degree1, degree2) {
		if (degree1 in [-1, 1]) 
			if (degree2 == -1) return 1;
		else return degree2

		if (degree2 in [-1, 1]) 
			return degree1

		if (degree1 >0 && degree2>0)
			return degree1+degree2-1;

		if (degree1 <0 && degree2<0)
			return degree1+degree2-1;

		if ((degree1 < 0 && degree2>0) || (degree1>0 && degree2<0)) {
			var pos = Math.max(degree1, degree2)
			var neg = -Math.min(degree1, degree2)

			if (pos >= neg) return degree1+degree2+1;
			if (neg > pos) return degree1+degree2-1;
		}
	}

	this.fullDegree = function() {
		return this.degree + this.octave*7;
	}

	this.semitones =  function() {
		return degreeToSemitones(this.degree) + this.accidentals;
	}
	this.fullSemitones = function() {
		return degreeToSemitones(this.degree) + this.accidentals + this.octave*12;
	}
	this.Octivate = function(degree, octave) {
		if (degree<1) {
			while (degree < 1) {
				octave--;
				degree += 7;
			}
			degree+=2;
		}
		while (degree > 7) {
			octave++;
			degree -= 7;
		}
		return [degree, octave]
	}

	this.invert = function(degree, accidentals) {
		var target_degree = 9-degree;
		var target_semitones = 12 - degreeToSemitones(degree)-accidentals;
		
		var naturalref_semitones = degreeToSemitones(target_degree);
		var target_accidentals = target_semitones - naturalref_semitones;
		return [target_degree, target_accidentals]
	}
	this.switchDir = function(dir) {
		return {">":"<", "<":">"}[dir];
	}


	this.init(name);
};


function Note(note) {
	if (typeof(note) == "string") {
		var re_validNote = /[A-G][b#]*[-]?\d$/;
		var re_octave = note.search(/[-]?\d+/);

		assert(re_validNote.test(note), "Invalid note name " + note);
		this.note_deg = noteToInt(note[0]);
		this.accidentals = accidentalsToInt(note.slice(1, re_octave));
		this.octave = parseInt(note.slice(re_octave));
	}
	this.note = function() {
		return String(intToNote(this.note_deg)) + intToAccidental(this.accidentals) + String(this.octave);
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
		var naturalref_semitones = degreeToSemitones(target_note);
		var accidentals = intToAccidental(sum_semitones - naturalref_semitones);
		return new Note(intToNote(target_note)+accidentals+target_octave);
	}

	this.add = function(interval) {
		assert(interval instanceof Interval, "Can only add Intervals to Notes");
		if (interval.dir == "<"){
			return this.sub(new Interval(interval.interval(undefined,undefined,interval.switchDir(interval.dir))));
		}
		var target_note = this.note_deg + interval.degree -1;
		var sum_semitones = this.fullSemitones() + interval.fullSemitones();
		return this._genNote(target_note, sum_semitones);
	};

	this.sub = function(value) {
		if(value instanceof Interval) { return this.sub_interval(value);}
		else if (value instanceof Note) { return this.sub_note(value); }
	}
	this.sub_note = function(other) {
		var interval = new Interval("b2");
		var target_degree = interval.addDegrees(other.note_deg, - this.note_deg);
		var target_octave = other.octave - this.octave;
		var target_dir = ">";

		var octivate = interval.Octivate(target_degree, target_octave);
		target_degree = octivate[0];
		target_octave = octivate[1];

		//work out accidentals
		var target_semitones = other.semitones() - this.semitones();
		while (target_semitones<0) target_semitones+=12;

		var naturalref_semitones = degreeToSemitones(target_degree);
		var target_accidentals = target_semitones - naturalref_semitones;

		if (target_octave < 0) {
			target_octave = -target_octave - 1;
			var degAcc = interval.invert(target_degree, target_accidentals);
			target_degree = degAcc[0];
			target_accidentals = degAcc[1];
			target_dir = interval.switchDir(target_dir);
		}

		target_degree += target_octave*7;
		var target_accidentals_str = intToAccidental(target_accidentals)
		return new Interval(target_accidentals_str + String(target_degree)+target_dir)
	}


	this.sub_interval = function(interval) {
		assert(interval instanceof Interval, "Can only subtract Intervals from Notes");
		if (interval.dir == "<"){
			return this.add(new Interval(interval.interval(undefined,undefined,interval.switchDir(interval.dir))));
		}
		var target_note = interval.addDegrees(this.note_deg, -interval.degree);
		target_note = interval.Octivate(target_note, 0)[0];
		var sum_semitones = this.fullSemitones() - interval.fullSemitones();
		return this._genNote(target_note, sum_semitones);
	};
	this.fullDegree = function() {
		return this.note_deg + this.octave*7;
	}
	this.semitones =  function() {
		var value =  degreeToSemitones(this.note_deg) + this.accidentals;
		if (value < 0)
			value += 12;
		if (value > 11)
			value -= 12;
		return value
	}
	this.fullSemitones = function() {
		return degreeToSemitones(this.note_deg) + this.accidentals + this.octave*12;
	}
}

function ScaleFormula(name, interval_list) {
	assert(typeof(interval_list) == "string", "ScaleFormula must take a string for now")
	interval_list = interval_list.split(" ");
	this.name = name;
	this.intervals = [];
	for (var i=0; i< interval_list.length; i++) {
		this.intervals.push(new Interval(interval_list[i]));
	}
}

function Scale(root, formula) {
	this.root = root;
	this.formula = formula;
}

