function updateScaleFromForm(note, scale, shape) {
	note = new Note(note+2)
	var formula = {
		"major":  new ScaleFormula("major", "1 2 3 4 5 6 7"),
		"minor":  new ScaleFormula("minor", "1 2 b3 4 5 b6 b7"),
		"pent_major":  new ScaleFormula("pent_major", "1 2 3 5 6"),
		"pent_minor":  new ScaleFormula("pent_minor", "1 b3 4 5 b7")
		}[scale];
	var shape = {
		"C": new Shape({name:"C", baseString:1, allFretsAbove:0, allFretsBelow:3}),
		"A": new Shape({name:"A", baseString:1, allFretsAbove:3, allFretsBelow:1}),
		"G": new Shape({name:"G", baseString:0, allFretsAbove:0, allFretsBelow:3}),
		"E": new Shape({name:"E", baseString:0, allFretsAbove:2, allFretsBelow:1}),
		"D": new Shape({name:"D", baseString:2, allFretsAbove:3, allFretsBelow:1})
	}[shape]
	updateScale(note, formula, shape)
}
function processScaleForm(form) {
	var form = $(this).parent();
	var root = form.find("[name=root]").val();
	var scale = form.find("[name=scale]").val();
	var shape = form.find("[name=shape]").val();
	updateScaleFromForm(root, scale, shape);

}

function togglePlay(button) {
	$(this).text(play())
}

function finished() {
	$('.play').hide();
	$('.finish').hide();
	$('<a href="'+designPath+'"> Return </a>').appendTo('body');

}
function notFinished() {
	$('.play').show()
}

function addPractiseLogEntry(root, scale, shape, seconds, tempo) {
	var min_secs = parseInt($(".pl_footer :input").val());
	if (seconds >= min_secs) {
		var elem = $("<div></div>").addClass('pl_entry');
		elem.append($("<p></p>").text(root + " " +scale));
		elem.append($("<p></p>").text(shape+" Shape"));
		elem.append($("<p></p>").text(tempo+"BPM"));

		var minutes = pad(Math.floor(seconds/60),2);
		var seconds = pad(seconds%60, 2);
		var time = String(minutes) + ":" + String(seconds);
		elem.append($("<p></p>").text(time));
		$('.pl_entry_area').prepend(elem);
	}
}
