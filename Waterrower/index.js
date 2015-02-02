'use strict'; 

// Read Waterrower
//
// Initialise
var Serialport = require('serialport');
var response = {device:'unknown', connected:false};
var values = {STROKE_COUNT:-1, TOTAL_SPEED:-1, AVERAGE_SPEED:-1, DISTANCE:-1, HEARTRATE:-1};


var serialConnection;
var portname = 'NULL';
var debug = process.env.DEBUG?console.log():function(){};
var validPorts = ['com.tty.foo', 'com.tty.foo', 'com.tty.foo', 'com.tty.foo']; //TODO: connect to rower or arduino simulator

// State of the USB Serial connection
var READ_RATE = 800;// frequency at which we query the S4/S5 in ms
var BAUD_RATE = 19200;// baud rate of the S4/S5 com port connection

var connection = {}; // TODO: not currently used, proper state handling
connection.state = {
	CLOSED:'com.waterrower.state.closed',
	CONNECTING:'com.waterrower.state.connecting',
	CONNECTED:'com.waterrower.state.connected',
	ERRORED:'com.waterrower.state.errored',
};

var strokeStartCallback = null;

var state = connection.state.CLOSED;

exports.readStrokeCount = function(callback) { //TODO: async callback with (err, value) arguments
return values.STROKE_COUNT;
}

exports.readTotalSpeed = function(callback) { //TODO: async callback with (err, value) arguments
return values.TOTAL_SPEED/100;// m/s
}

exports.readAverageSpeed = function(callback) { //TODO: async callback with (err, value) arguments
return values.AVERAGE_SPEED/100;// m/s
}

exports.readDistance = function(callback) { //TODO: async callback with (err, value) arguments
return values.DISTANCE;// m
}

exports.readHeartRate = function(callback) { //TODO: async callback with (err, value) arguments
return values.HEARTRATE;// bpm
}

exports.notifyStrokeStart = function(callback) { //TODO: async callback with (err, value) arguments
	strokeStartCallback = callback;
}



var getState = function() {
  return (state);
}

var putState =function(value) {
  state = value;
}

var open = function() {
    resetMessage();
    getPort();
    state = 'open';
}

var close = function() {
  debug('waterrower closed');
  serialConnection.close();
  state = 'closed';
}

// serialport functions
var getPort = function() {
  var ports;
  var i = 0;
  portname = 'NULL';
  com.list(function (err, ports) {
    debug('Number of ports=' + ports.length);
    ports.forEach(function(port) {  
      debug('com name ' + port.comName);
      debug('port ID ' + port.pnpId);
      portname = ports[i].comName;
      i++;
    });
  });
};

var readWrite = function() {
	state = getState();
	switch (state) {
		case 'closed':
			debug('in readWrite closed call open');
			open();
			break;
		case 'open':
			if(debug) console.log('in readWrite open call read');
			count = 0;
			read(portname, function(err, data) {
				if (err) {
					putState('closed')
				} else if (!err && data == 'disconnected') {
					putState('closed')
				} else if (!err && data == 'ready') {
					debug('<' + data);
					response = readMessage(data);
				}
			});
			break;
		case 'connecting':
		    debug('in readWrite connecting');
		    break;
		case 'read':
			write(nextMessage);
			break;
		case 'error':
			debug('in readWrite error call close');
			close();
			break;
		default:
			console.log('wtf ' + state)
	}
}

setInterval(readWrite, READ_RATE);


var read = function(portname, dataCallback) { // dataCallback(error, data)

      debug('in read connecting to ' + portname);
      state = 'connecting';

	  serialConnection = new com.SerialPort(portname, {
	    baudrate: BAUD_RATE, disconnectedCallback:function () { dataCallback('disconnected') },
	    parser: com.parsers.readline('\n')
	  });

	  serialConnection.on('error', function(err) {
	    debug('serialConnection error ' + err);
	    state = 'error';
	    dataCallback(err, null);
	  });

	  serialConnection.on('open', function () {
	    debug('serialConnection open');
	    state = 'read';
	    dataCallback(null, 'open');
	  });

	  serialConnection.on('closed', function () {
	    debug('serialConnection closed');
	    state = 'read';
	    dataCallback(null, 'closed');
	  });

	  serialConnection.on('data', function(data) {

	    debug('serialConnection read >' + data.trim() + '<');

	    state = 'read';

	    if (data.substring(0,1) == 'P') {
	      data = 'PULSE';
	    }
	    else if (data.substring(0,1) == 'S') {
	      data = 'STROKE';
	    }
	    else {
	      data = data.trim();
	    }

	    switch (data) {
		    case 'PING':
				break;
		    case 'PULSE':
				break;
		    case 'STROKE':
		      	if(strokeStartCallback){strokeStartCallback();}
				break;
		    default:
				dataCallback(null, data);
	    }

	  });
};


var write = function(buffer) {
  debug('>' + buffer)
  serialConnection.write(buffer + '\r\n',  function(err, result) {
    if (err == null)
    {
      return ('');
    }
    else
    {
      console.log('In write ' + err);
      state = 'error';
      return (state);
    }   
  });
}

// Waterrower messages
var nextMessage = 'USB';
var arduino ={
	'USB':{'response':'CONNECTED','next':'IDS14010'},
	'IDS140':{'response':'STROKE_COUNT','next':'IDD14811'},
	'IDD148':{'response':'TOTAL_SPEED','next':'IDD14A12'},
	'IDD14A':{'response':'AVERAGE_SPEED','next':'IDD05713'},
	'IDD057':{'response':'DISTANCE','next':'IDS1A005'},
	'IDS1A0':{'response':'HEARTRATE','next':'IDS14010'}
	};


var wr5 ={
	'_WR_':{'response':'CONNECTED','next':'IRD140'},
	'IDD140':{'response':'STROKE_COUNT','next':'IRD148'},
	'IDD148':{'response':'TOTAL_SPEED','next':'IRD14A'},
	'IDD14A':{'response':'AVERAGE_SPEED','next':'IRD057'},
	'IDD057':{'response':'DISTANCE','next':'IRS1A0'},
	'IDS1A0':{'response':'HEARTRATE','next':'IRD140'},
	'AKR':{'response':'RESET','next':'IRD140'}
	};


var readMessage = function(message) {

    var response = {device:'unknown', parameters:[], connected:false};

    message = message.trim();

    debug(message);

    if (type == 'unknown') {
		if (message == 'USB') {
			type = 'arduino';
			response.connected = true;
			nextMessage = arduino[message]['next'];
			debug('Connected to ' + type);
		}
		else if (message == '_WR_') {
			type = 'wr5';
			response.connected = true;
			nextMessage = wr5[message]['next'];
		}
		else {
			nextMessage = 'USB';
		}
    }
    else if (type == 'arduino') {
	response.device = 'arduino';
	response.connected = true;
	if (message.length >= 6){
		if (arduino.hasOwnProperty(message.substring(0, 6))) {
			var _key = arduino[message.substring(0, 6)]['response'];
			debug(' key=' + _key + ' value=' + ACHtoDecimal(message.substring(6)));
			values[_key] = ACHtoDecimal(message.substring(6));
			nextMessage = arduino[message.substring(0, 6)]['next'];
		}
		else {
			console.error('readMessage cannot find ' + message);
		}
	}
	else {
		console.error('readMessage unexpected ' + message);
	}
    }
    else if (type == 'wr5') {
	response.device = 'waterrower';
	response.connected = true;
	if (message.length >= 6){
		if (this.wr5.hasOwnProperty(message.substring(0, 6))) {
			var _key = this.wr5[message.substring(0, 6)]['response'];
			if (message.length > 6) {
				values[_key] = ACHtoDecimal(message.substring(6));
			}
			nextMessage = wr5[message.substring(0, 6)]['next'];
		}
		else {
			console.error('readMessage cannot find |' + message.substring(0, 6) + '|');
		}
	}
	else if (message == 'AKR') {
		nextMessage = wr5[message]['next'];
	}
	else {
		console.error('readMessage unexpected ' + message);
	}
    }
    else {
		console.error('readMessage bad type ' + type)
    }
    return (response);
}

var resetMessage = function() {
    type = 'unknown';
    nextMessage = 'USB';
}

function ACHtoDecimal(input) {
	var value;
	var total = 0;
	for (i = 0; i < input.length; i++) {
		total = total * 16;
		value = input.charCodeAt(i) - 48;
		if (value > 9) {
			value = value - 7;
		}
		total = total + value;
	}
	return (total);
}

function ACHtoDecimalReverse(input) {
	var value;
	var total = 0;
	for (i = input.length - 1; i >= 0; i--) {
		total = total * 16;
		value = input.charCodeAt(i) - 48;
		if (value > 9) {
			value = value - 7;
		}
		total = total + value;
	}
	return (total);
}

