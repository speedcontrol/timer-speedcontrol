// Code based off of stuff used for the SGDQ15 layouts.
// https://github.com/GamesDoneQuick/sgdq15-layouts/blob/master/extension/stopwatches.js

var fs = require('fs-extra');

// Set up server.
var ipc = require('node-ipc');
ipc.config.id = 'timer-speedcontrol';
ipc.config.silent = true;
ipc.serve(() => {
	console.log('Server started.');
});
ipc.server.start();

// Storage for the stopwatch data.
var defaultStopwatch = {time: '00:00:00', state: 'stopped', milliseconds: 0};
var stopwatch = {value: defaultStopwatch};

var stopwatchPersist = fs.readJsonSync('./persist.json', {throws:false});
if (stopwatchPersist) {
	console.log('Loaded previous stopwatch data from persist file.');
	stopwatch.value = stopwatchPersist;
}

// If the timer was running when last closed, changes it to being paused.
if (stopwatch.value.state === 'running') {
	stopwatch.value.state = 'paused';
	fs.writeJson('./persist.json', stopwatch.value);
}

// Load the existing time and start the stopwatch at that if needed/possible.
var startMS = stopwatch.value.milliseconds || 0;

// Set up the Rieussec timer.
var Rieussec = require('rieussec');
var rieussec = new Rieussec(1000);
rieussec.setMilliseconds(startMS);

// What to do on every "tick" (every 1s).
// Updates the stored time in both formats and broadcasts the change.
rieussec.on('tick', ms => {
	stopwatch.value.time = msToTime(ms);
	stopwatch.value.milliseconds = ms;
	ipc.server.broadcast('tick', JSON.stringify(stopwatch.value));
	fs.writeJson('./persist.json', stopwatch.value);
});

// Update the state of the timer whenever it changes and broadcast the change.
rieussec.on('state', state => {
	stopwatch.value.state = state;
	ipc.server.broadcast('state', stopwatch.value.state);
	console.log('State changed: '+state);
	fs.writeJson('./persist.json', stopwatch.value);
});

// If the client requests the stopwatch object, broadcasts this.
ipc.server.on('getStopwatchObj', () => {
	console.log('Stopwatch object requested.');
	ipc.server.broadcast('stopwatchObj', JSON.stringify(stopwatch.value));
});

// If the client wants to start the timer...
ipc.server.on('startTime', () => {
	console.log('Started timer.')
	rieussec.start();
});

// If the client wants to pause the timer...
ipc.server.on('pauseTime', () => {
	console.log('Paused timer.')
	rieussec.pause();
});

// If the client wants to stop/finish the timer...
ipc.server.on('finishTime', () => {
	console.log('Ended timer.')
	rieussec.pause();
	
	// Manually set a "finished" state when done.
	stopwatch.value.state = 'finished';
	ipc.server.broadcast('state', stopwatch.value.state);
	console.log('State changed: '+stopwatch.value.state);
	fs.writeJson('./persist.json', stopwatch.value);
});

// If the client wants to reset the timer...
ipc.server.on('resetTime', () => {
	console.log('Reset timer.')
	rieussec.reset();
});

// If the client wants to set the time to something else...
ipc.server.on('setTime', time => {
	console.log('Reques to edit timer, input: '+time+'.');
	
	// Check to see if the time was given in the correct format and if it's stopped/paused.
	// (This check should be done on the other side too, but doing it here for safety).
	if (stopwatch.value.state === 'stopped' || stopwatch.value.state === 'paused'
	|| time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
		// Pause the timer while this is being done.
		rieussec._cachedState = rieussec._state;
		rieussec.pause();
		
		rieussec.setMilliseconds(timeToMS(time));
		
		// If a timer was paused just for this, unpause it.
		if (rieussec._cachedState === 'running') rieussec.start();
	}
});

function msToTime(duration) {
	var seconds = parseInt((duration/1000)%60),
		minutes = parseInt((duration/(1000*60))%60),
		hours = parseInt((duration/(1000*60*60))%24);
	
	hours = (hours < 10) ? '0' + hours : hours;
	minutes = (minutes < 10) ? '0' + minutes : minutes;
	seconds = (seconds < 10) ? '0' + seconds : seconds;
	
	return hours + ':' + minutes + ':' + seconds;
}

function timeToMS(duration) {
	var ts = duration.split(':');
	if (ts.length === 2) ts.unshift('00'); // Adds 0 hours if they are not specified.
	return Date.UTC(1970, 0, 1, ts[0], ts[1], ts[2]);
}