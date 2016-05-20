var context = null;
var canvasWidth = null;
var canvasHeight = null;


function drawLine(x1, y1, x2, y2){
	context.beginPath();
	context.moveTo(x1, y1);
	context.lineTo(x2, y2);
	context.stroke();
};

function drawCircle(x, y, radius) {
	context.beginPath();
	context.fillStyle = "white"
	context.arc(x, y, radius, 0, Math.PI*2);
	context.fill();
	context.stroke();
};


function FretboardRenderer(fretboard) {
	this.fretboard = fretboard;
	this.fretboard.renderer = this;

	this.fret_count = this.fretboard.fret_count;
	this.string_count = this.fretboard.strings.length;

	this.left = 100;
	this.top = 30;
	this.width = 1300;
	this.height = 150;
	this.right = this.left + this.width;
	this.bottom = this.top + this.height;

	this.padding_top = 20;
	this.padding_bottom = 20;
	this.padding_left = 20;
	this.padding_right = 20;

	this.frets_overhang = 3;

	this.strings_top = this.top+this.padding_top;
	this.strings_left = this.left + this.padding_left;
	this.strings_right = this.right - this.padding_right;
	this.strings_bottom = this.bottom - this.padding_bottom;
	this.strings_length = this.strings_right - this.strings_left;
	this.strings_height = this.strings_bottom - this.strings_top;
	this.strings_spacer = this.strings_height/(this.string_count-1)

	this.frets_top = this.strings_top - this.frets_overhang;
	this.frets_bottom = this.strings_bottom + this.frets_overhang;

	this.frets_open_position = -15;

	this.frets_open_width = 90;

	this.finger_min_margin = 2; //Gap between adjacent dots
	this.finger_max_size = this.strings_spacer/2 - this.finger_min_margin;
	this.finger_start_radius = 20; //Percentages of fret width
	this.finger_end_radius =  40;

	this.single_inlay_frets = [3, 5, 7, 9, 15, 17, 19];
	this.double_inlay_frets = [12, 24];
	this.inlay_radius = 5;

	this.init = function(){
		//Fret positions & Finger positions
		var frets = this.fret_count;
		var scale_length = this.strings_length * Math.pow(2, frets/12) / (Math.pow(2, frets/12) - 1);
		this.fret_position = [0];
		this.finger_position = [this.frets_open_position];
		this.inlay_position = [0];
		this.fret_width = [this.frets_open_width];
		for (i=1; i<frets; i++){
			this.fret_position[i] = scale_length - (scale_length / Math.pow(2, i/12));
			this.fret_position[i] = Math.round(this.fret_position[i]);
			var curFret = this.fret_position[i];
			var prevFret = this.fret_position[i-1];
			var fretWidth = curFret - prevFret;
			this.fret_width[i] = fretWidth;
			var fretCenter = prevFret + fretWidth/2;
			this.finger_position[i] = fretCenter;
			this.inlay_position[i] = fretCenter;
		}
		//String Positions
		this.string_position = []
		for (var i=0; i<this.string_count; i++) {
			this.string_position[i] = this.strings_spacer*i;
		}
	};

	this.drawFrets = function(){
		for (var i=0; i<this.fret_position.length; i++) {
			var x = this.fret_position[i] + this.strings_left;
			drawLine(x, this.frets_top, x, this.frets_bottom);
		}
	};

	this.drawStrings = function() {
		for (var i=0; i<this.string_count; i++) {
			var y = this.string_position[i] + this.strings_top;
			drawLine(this.strings_left, y, this.strings_right, y);
		}
	};

	this.drawSingleInlay = function(i) {
		x = this.strings_left + this.inlay_position[i];
		y = this.strings_top + this.strings_height/2;
		drawCircle(x, y, this.inlay_radius);
	}
	this.drawDoubleInlay = function(i) {
		x = this.strings_left + this.inlay_position[i];
		y1 = this.strings_top + this.strings_height/3;
		y2 = this.strings_top + (this.strings_height/3)*2;
		drawCircle(x, y1, this.inlay_radius);
		drawCircle(x, y2, this.inlay_radius);
	}
	this.drawInlays = function() {
		for (i=0; i<this.fret_count; i++) {
			if (i in this.single_inlay_frets)
				this.drawSingleInlay(this.single_inlay_frets[i])
			if (i in this.double_inlay_frets)
				this.drawDoubleInlay(this.double_inlay_frets[i])
		}
	}
	this.draw = function() {
		context.clearRect(0, 0, canvasWidth, canvasHeight);
		this.drawInlays();
		this.drawFrets();
		this.drawStrings();
	}


	this.calcNoteSize = function(fret_no) {
		var width = this.fret_width[fret_no]/2;
		var min_percent = this.finger_start_radius;
		var max_percent = this.finger_end_radius;
		var percent_difference = (max_percent - min_percent)/this.fret_count;
		var current_percent = min_percent  + percent_difference * i;

		var radius = (width/100)*current_percent;
		if (radius > this.finger_max_size) radius =  this.finger_max_size;
		return radius;
	};

	this.getPos = function(string_no, fret_no) {
		string_no = this.string_count -1 - string_no
		return [this.finger_position[fret_no] + this.strings_left, this.string_position[string_no] + this.strings_top]
	}

}

function hexCounter(value) {
	value = Math.floor(255*value);
	str = value.toString(16)
	return "#"+str+str+str;
}
function animateNote(duration, note) {
	var start = new Date().getTime();
	var end = start + duration;
	var step = function() {
		var timestamp = new Date().getTime();
		var progress = Math.min((duration - (end - timestamp)) / duration, 1)

		if (progress < 0.64) 
			var c_val = Math.round(Math.cos(progress*Math.PI*0.6)*100)/100;
		else
			var c_val = 1-Math.round(Math.cos(progress*Math.PI/2)*100)/100;


		var fs = hexCounter(c_val);

		context.fillStyle = "#fff";
		context.beginPath();
		context.arc(note.x, note.y, note.radius+1, 0, Math.PI*2);
		context.closePath();
		context.fill();

		var rad = note.radius;
		context.beginPath();
		context.fillStyle = fs;
		context.arc(note.x, note.y, rad, 0, Math.PI*2);
		context.closePath();
		context.fill();

		context.beginPath();
		context.arc(note.x, note.y, rad, 0, Math.PI*2);
		context.closePath();
		context.stroke();

		if (progress < 1) {
			requestAnimationFrame(step);
		}
	}
	step();
}
