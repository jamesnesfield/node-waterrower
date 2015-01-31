// Read Waterrower
//
// Initialise
var debug = true;

var response = {device:'unknown', connected:false};
var values = [];

exports.readStrokeCount = function() {
return values["STROKE_COUNT"];
}

exports.readTotalSpeed = function(callback) {
return values["TOTAL_SPEED"];
}

exports.readAverageSpeed = function(callback) {
return values["AVERAGE_SPEED"];
}

exports.readDistance = function(callback) {
return values["DISTANCE"];
}

exports.readHeartRate = function() {
return values["HEARTRATE"];
}

// State of the USB Serial connection
var state = "closed";

getState = function() {
  return (state);
}

putState =function(value) {
  state = value;
}

open = function() {
    resetMessage();
    getPort(function(data){
    });
    state = "open";
}

close = function() {
  console.log("closed");
  conn.close();
  state = "closed";
  //conn = null;
}

// serialport functions
var com = require("serialport")
var conn;
var portname = "NULL";

getPort = function() {
  var ports;
  var i = 0;
  portname = "NULL";
  com.list(function (err, ports) {
    if (debug) console.log("Number of ports=" + ports.length);
    ports.forEach(function(port) {  
      if (debug) console.log("com name " + port.comName);
      if (debug) console.log("port ID " + port.pnpId);
      //console.log(port.manufacturer);
      // the last port is usually the one
      portname = ports[i].comName;
      i++;
    });
  });
};

var readWrite = function() {
	state = getState();
	switch (state) {
		case "closed":
			if(debug){ console.log("in readWrite closed call open");}
			open();
			break;
		case "open":
			if(debug) console.log("in readWrite open call read");
			count = 0;
			read(function(data) {
				if (data == "disconnected") {
					putState("closed")
				}
				else if (data == "error") {
					putState("closed")
				}
				else if (data == "ready") {
					;
				}
				else {
					if(debug) console.log("<" + data);
					response = readMessage(data);
				}
			});
			break;
		case "connecting":
		        if(debug) console.log("in readWrite connecting");
		        break;
		case "read":
			write(nextMessage);
			break;
		case "error":
			if(debug) console.log("in readWrite error call close");
			close();
			break;
		default:
			console.log("wtf " + state)
	}
}

setInterval(readWrite, 800);


read = function(callback) {
          if(debug) console.log("in read connecting to " + portname);
          state = "connecting";
	  conn = new com.SerialPort(portname, {
	    baudrate: 19200, disconnectedCallback:function () { callback("disconnected") },
	    parser: com.parsers.readline("\n")
	  });
	  conn.on("error", function(err) {
	    if(debug) console.log("in read " + err);
	    console.log("Cannot connect to " + portname);
	    state = "error";
	    callback(state);
	  });
	  conn.on("open", function () {
	    if(debug)console.log("in read open");
	    state = "read";
	    callback("");
	  });
	  conn.on("closed", function () {
	    if(debug)console.log("in read closed");
	    state = "read";
	    callback("");
	  });
	  conn.on("data", function(data) {
	    if(debug)console.log('in read>' + data.trim() + "<");
	    state = "read";
	    //console.log()
	    // the parser seems to handle the \r as well!
	    //data  = data.substring(0, data.length -1)
	    if (data.substring(0,1) == "P") {
	      data = "PULSE";
	    }
	    else if (data.substring(0,1) == "S") {
	      data = "STROKE";
	    }
	    else {
	      data = data.trim();
	    }
	    switch (data) {
	      case "PING":
		//console.log("<................" + data)
		break;
	      case "PULSE":
		break;
	      case "STROKE":
		break;
	      default:
		callback(data);
	    }
	  });
};


write = function(buffer) {
  if(debug)console.log(">" + buffer)
  conn.write(buffer + "\r\n",  function(err, result) {
    if (err == null)
    {
      return ("");
    }
    else
    {
      console.log("In write " + err);
      state = "error";
      return (state);
    }   
  });
}

// Waterrower messages
var nextMessage = "USB";
var arduino ={
	"USB":{"response":"CONNECTED","next":"IDS14010"},
	"IDS140":{"response":"STROKE_COUNT","next":"IDD14811"},
	"IDD148":{"response":"TOTAL_SPEED","next":"IDD14A12"},
	"IDD14A":{"response":"AVERAGE_SPEED","next":"IDD05713"},
	"IDD057":{"response":"DISTANCE","next":"IDS1A005"},
	"IDS1A0":{"response":"HEARTRATE","next":"IDS14010"}
	};


var wr5 ={
	"_WR_":{"response":"CONNECTED","next":"IRD140"},
	"IDD140":{"response":"STROKE_COUNT","next":"IRD148"},
	"IDD148":{"response":"TOTAL_SPEED","next":"IRD14A"},
	"IDD14A":{"response":"AVERAGE_SPEED","next":"IRD057"},
	"IDD057":{"response":"DISTANCE","next":"IRS1A0"},
	"IDS1A0":{"response":"HEARTRATE","next":"IRD140"},
	"AKR":{"response":"RESET","next":"IRD140"}
	};

values["STROKE_COUNT"] = 0;
values["TOTAL_SPEED"] = 0;
values["AVERAGE_SPEED"] = 0;
values["DISTANCE"] = 0;
values["HEARTRATE"] = 0;

readMessage = function(message) {
    var response = {device:'unknown', parameters:[], connected:false};
    message = message.trim();
    if (debug) console.log(message);
    if (type == "unknown") {
	if (message == "USB") {
		type = "arduino";
		response.connected = true;
		nextMessage = arduino[message]["next"];
		if (debug) console.log ("Connected to " + type);
	}
	else if (message == '_WR_') {
		type = "wr5";
		response.connected = true;
		nextMessage = wr5[message]["next"];
	}
	else {
		nextMessage = "USB";
	}
    }
    else if (type == "arduino") {
	response.device = 'arduino';
	response.connected = true;
	if (message.length >= 6){
		if (arduino.hasOwnProperty(message.substring(0, 6))) {
			var _key = arduino[message.substring(0, 6)]["response"];
			if (debug) console.log(" key=" + _key + " value=" + ACHtoDecimal(message.substring(6)));
			values[_key] = ACHtoDecimal(message.substring(6));
			nextMessage = arduino[message.substring(0, 6)]["next"];
		}
		else {
			console.log("readMessage cannot find " + message);
		}
	}
	else {
		console.log("readMessage unexpected " + message);
	}
    }
    else if (type == "wr5") {
	response.device = 'waterrower';
	response.connected = true;
	if (message.length >= 6){
		if (this.wr5.hasOwnProperty(message.substring(0, 6))) {
			var _key = this.wr5[message.substring(0, 6)]["response"];
			if (message.length > 6) {
				values[_key] = ACHtoDecimal(message.substring(6));
			}
			nextMessage = wr5[message.substring(0, 6)]["next"];
		}
		else {
			console.log("readMessage cannot find |" + message.substring(0, 6) + "|");
		}
	}
	else if (message == "AKR") {
		nextMessage = wr5[message]["next"];
	}
	else {
		console.log("readMessage unexpected " + message);
	}
    }
    else {
		console.log("readMessage bad type " + type)
    }
    return (response);
}

resetMessage = function() {
    type = "unknown";
    nextMessage = "USB";
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

