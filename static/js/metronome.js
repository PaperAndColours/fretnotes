var timer = null;
var tempo = 120.0;          // tempo (in beats per minute)
var lookahead = 25.0;       // How frequently to call scheduling function 
var noteLength = 0.05;
var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
var lastEvent = -1;
var eventsInQueue = [];
var nextTime = 0.0;
var nextEvent = 0;
var timeWorker = null;
var isPlaying = false;
var animDelay = 500;

function play() {
    isPlaying = !isPlaying;

    if (isPlaying) { // start playing
        nextEvent = 0;
		scale_container.reset();
        nextTime = audioContext.currentTime;
        timerWorker.postMessage("start");
		timer.start();
        return "Stop";
    } else {
        timerWorker.postMessage("stop");
		timer.stop();
        return "Play";
    }
}

function scheduler() {
    while (nextTime < audioContext.currentTime + scheduleAheadTime ) {
		eventsInQueue.push( { note: nextEvent, time: nextTime } );
		var osc = audioContext.createOscillator();
		osc.connect( audioContext.destination );
		osc.frequency.value = 880.0;
		osc.start( nextTime );
		osc.stop( nextTime + noteLength );

		var secondsPerBeat = 60.0 / tempo;    // current tempo
		nextTime += 1 * secondsPerBeat;    
		nextEvent++;
    }
}

function draw() {
    var currentEvent = lastEvent;
    var currentTime = audioContext.currentTime;

    while (eventsInQueue.length && eventsInQueue[0].time < currentTime) {
        currentEvent = eventsInQueue[0].note;
        eventsInQueue.splice(0,1);   
    }
    // We only need to draw if the note has moved.
    if (lastEvent != currentEvent) {
		scale_container.animate_next();
        lastEvent = currentEvent;
    }

    requestAnimFrame(draw);
}
