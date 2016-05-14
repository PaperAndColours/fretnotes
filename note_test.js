function Framework(name, interaction, evaluation, representations) {
	this.name = name;
	this.evaluation = evaluation;
	this.interaction = interaction; //e.g. add, etc
	this.evaluation = evaluation; //e.g. =, <, >
	this.representations = representations

	this.repr = function(value) {
		var type = value.constructor.name;
		return this.representations[type](value);
	}
}
Interval("b2")
Interval("b5")
Interval("bb7")

Interval.add

representation_std = {
	Interval: function(interval) {return interval.interval()},
	Note: function(note) {return note.note()}
}


evaluation_eq = function(e1, targ) {
	return e1 == targ;
};
evaluation_eq_semitones = function(e1, targ) {
	return e1.semitones == targ.semitones;
};
evaluation_eq_notename = function(e1, targ) {
	return e1.note() == targ.note();
};
evaluation_eq_intervalname = function(e1, targ) {
	return e1.interval() == targ.interval();
};

interaction_add= function(e1,e2) {
	return e1.add(e2);
};
interaction_sub = function(e1,e2) {
	return e1.sub(e2);
};

function Suite(container, name, framework) {
	this.framework = framework;
	this.container = $('<div></div>').addClass("suite");
	this.header_box = $('<div></div>').addClass("suite_header_box");
	this.header = $('<h2></h2>').text("Suite: "+name).addClass("suite_header");
	this.header_box.append(this.header);
	this.container.append(this.header_box);

	container.append(this.container);

	this.binaryTest = function(elem1, elem2, target) {
		var interaction_result = this.framework.interaction(elem1, elem2);
		var evaluation_result = this.framework.evaluation(interaction_result, target);
		var repr_elem1 = this.framework.repr(elem1);
		var repr_elem2 = this.framework.repr(elem2);
		var repr_target = this.framework.repr(target);
		var repr_interaction_result = this.framework.repr(interaction_result);
		var name = this.framework.name;

		var suite_test = $('<div></div>').addClass("suite_test");
		var test_header = $('<div></div>').text(name).addClass("suite_fw_name suite_test_header");

		var container_e1 = $('<div></div>').text("Element 1 ("+elem1.constructor.name+")").addClass("suite_container");
		var container_e2 = $('<div></div>').text("Element 2 ("+elem2.constructor.name+")").addClass("suite_container");
		var container_interaction = $('<div></div>').text("Result ("+interaction_result.constructor.name+")").addClass("suite_container");
		var container_target = $('<div></div>').text("Target ("+target.constructor.name+")").addClass("suite_container");
		var container_eval = $('<div></div>').text("Test").addClass("suite_container");

		var box_e1 = $('<div></div>').text(repr_elem1).addClass("suite_elem1 suite_testbox");
		var box_e2 = $('<div></div>').text(repr_elem2).addClass("suite_elem2 suite_testbox");
		var box_interaction = $('<div></div>').text(repr_interaction_result).addClass("suite_interaction suite_testbox");
		var box_target = $('<div></div>').text(repr_target).addClass("suite_target suite_testbox");
		var box_eval = $('<div></div>').text(evaluation_result).addClass("suite_result suite_testbox");

		if (evaluation_result == true) box_eval.addClass("test_true")
		else  box_eval.addClass("test_false");

		container_e1.append(box_e1);
		container_e2.append(box_e2);
		container_interaction.append(box_interaction);
		container_target.append(box_target);
		container_eval.append(box_eval);


		suite_test.append(test_header, container_e1, container_e2, container_interaction, container_target, container_eval);
		this.container.append(suite_test);
	}
}
