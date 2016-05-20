function Timer(options) {
  var timer,
  instance = this,
  updateStatus = options.onUpdateStatus || function () {},
  counterEnd = options.onCounterEnd || function () {};

  function incrementCounter() {
	updateStatus(seconds);
	seconds++;
  }

  this.start = function () {
	clearInterval(timer);
	timer = 0;
	seconds = 0;
	timer = setInterval(incrementCounter, 1000);
  };

  this.stop = function () {
	clearInterval(timer);
	counterEnd(seconds);
  };
};

function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function updateTimer(seconds){
	var minutes = pad(Math.floor(seconds/60),2);
	var seconds = pad(seconds%60, 2);
	$('.timer').text(String(minutes) + ":" + String(seconds));
}

timer = new Timer({onUpdateStatus: updateTimer, onCounterEnd: finishTimer});
function finishTimer(seconds) {
	var form = $(controls).parent();
	var root = form.find("[name=root]").val();
	var scale = form.find("[name=scale]").val();
	var shape = form.find("[name=shape]").val();
	addPractiseLogEntry(root, scale, shape, seconds, tempo);
}
