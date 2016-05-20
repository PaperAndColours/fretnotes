function GuitarString(root, frets) {
	this.root = new Note(root);
	this.frets = frets;
	this.highest = this.root + new Interval(frets);

	this.at_fret = function(fret) {
		return this.root.add(new Interval(fret));
	}
};

function Shape(options) {
	this.name = options.name;
	this.baseString = options.baseString;
	this.strings = options.strings || 6;
	this.single_frets_above = options.singleFretsAbove || {};
	this.single_frets_below = options.singleFretsBelow || {};
	this.all_frets_above = options.allFretsAbove;
	this.all_frets_below = options.allFretsBelow;
	this.scale_adjustments = {
		minor: -2,
		pent_minor:-2 
		};
	this.getFretsAbove = function(strng) {
		return this.single_frets_above[strng] || this.all_frets_above
	}
	this.getFretsBelow = function(strng) {
		return this.single_frets_below[strng] || this.all_frets_below
	}

	this.makeShape = function(root, strings, scale) {
		var strng = strings[this.baseString];
		while (root.fullSemitones() - strng.root.fullSemitones() > 12) root = root.sub(new Interval("8"))
		while (root.fullSemitones() - strng.root.fullSemitones() < 0) root = root.add(new Interval("8"))
		var adj = 0;
		if ($.inArray(scale.formula.name,Object.keys(this.scale_adjustments))>-1)
			adj = this.scale_adjustments[scale.formula.name];
		this.base = root.fullSemitones() - strng.root.fullSemitones() + adj;
		this.min = [];
		this.max = [];
		var addOctave = false;
		for (var i=0; i<6; i++){
			this.min.push(this.base - this.getFretsBelow(i))
			this.max.push(this.base + this.getFretsAbove(i))
			if (this.min.slice(-1) < 0)
				addOctave = true;
		}
		if (addOctave){
			for (var i=0; i<6; i++){
				this.min[i] += 12;
				this.max[i] += 12;
			}
		}
		this.size = this.max - this.min;
		this.cur_string = 0;
		this.cur_fret = this.min[this.cur_string];
		this.finished = false;
	}
	this.getNext = function() {
		var strng = this.cur_string;
		var fret = this.cur_fret;
		var finished = this.finished;

		if (this.cur_fret < this.max[this.cur_string]) this.cur_fret++;
		else if (this.cur_string < 5) {
			this.cur_string++;
			this.cur_fret = this.min[this.cur_string];
		}
		else
			this.finished = true;
		if (finished)
			return false;
		else
			return [fret, strng]
	}
}


function Fretboard() {
	this.fret_count = 21;
	this.strings = ["E2", "A2", "D3", "G4", "B4", "E5"].map(function(a) { return new GuitarString(a, this.fret_count) });

	this.getScale = function(scale, shape) {
		var fretNotes = [];
		var root = scale.root;
		shape.makeShape(root, this.strings, scale)
		var intervals = scale.formula.intervals;
		while (pos = shape.getNext()) {
			var fret = pos[0];
			var strng = pos[1];
			var cursor_note = this.strings[strng].at_fret(fret);

			for(var i=0; i<intervals.length; i++) {
			var scale_note = root.add(intervals[i]);
			if (cursor_note.semitones() == scale_note.semitones()) {
				var position = this.renderer.getPos(strng, fret);
				var x = position[0];
				var y = position[1];
				var radius = this.renderer.calcNoteSize(fret);
				fretNotes.push(new FretNote(cursor_note, intervals[i], fret, strng, x, y, radius));
				}
			}
		}
		return fretNotes;
	}
}

function FretNote(note, interval, fret, strng, x, y, radius ) {
	this.note = note;
	this.interval = interval;
	this.fret = fret;
	this.strng = strng;
	this.x = x;
	this.y = y;
	this.radius = radius;
};

function NoteCollection(fretboard_renderer) {
	this.index = 0;
	this.dir = 1;
	this.renderer = fretboard_renderer;
	this.animate_next = function() {
		animateNote(1000, this.notes[this.index]);
		this.index = (this.index+this.dir)%this.notes.length;
		if (this.index == this.notes.length-1) this.dir = -this.dir;
		if (this.index == 0 && this.dir ==-1) this.dir = -this.dir; }

	this.draw = function(){
		for(i=0; i<this.notes.length; i++) {
			var note = this.notes[i];
			drawCircle(note.x, note.y, note.radius);
		}
	}
	this.getRoots = function() {
		var roots = []
		for (var i=0; i<this.notes.length; i++){
			if (this.notes[i].interval.degree == "1")
				roots.push(this.notes[i]);
		}
		return roots;
	}
	this.setScale = function(notes) {
		this.notes = notes;
		this.reset();
		this.renderer.draw();
		this.draw();
	}
	this.reset = function() {
		this.index = this.notes.indexOf(this.getRoots()[0]);
		this.dir = 1;
	}
}

function updateScale(root, formula, shape) {
	var scale = new Scale(root, formula);
	var notes = fretboard.getScale(scale, shape);
	scale_container.setScale(notes);

}
