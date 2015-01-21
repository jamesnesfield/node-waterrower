var type = "unknown";
var nextMessage = "USB";

var debug = false;

exports.arduino = {
  "USB":{"response":"CONNECTED","next":"IDS14010"},
  "IDS140":{"response":"STROKE_COUNT","next":"IDD14811"},
  "IDD148":{"response":"TOTAL_SPEED","next":"IDD14A12"},
  "IDD14A":{"response":"AVERAGE_SPEED","next":"IDS14013"},
  };


exports.wr5 = {
  "_WR_":{"response":"CONNECTED","next":"IRD140"},
  "IDD140":{"response":"STROKE_COUNT","next":"IRD148"},
  "IDD148":{"response":"TOTAL_SPEED","next":"IRD14A"},
  "IDD14A":{"response":"AVERAGE_SPEED","next":"IRD057"},
  "IDD057":{"response":"DISTANCE","next":"IRS1A0"},
  "IDS1A0":{"response":"HEARTRATE","next":"IRD140"},
  "AKR":{"response":"RESET","next":"IRD140"}
  };


exports.connected = function(){
  return this.connected;
}

exports.readStrokeCount = function(callback) {
//TODO
}

exports.readTotalSpeed = function(callback) {
//TODO 
}

exports.readAverageSpeed = function(callback) {
//TODO
}

exports.readDistance = function(callback) {
//TODO 
}

exports.readheartrate = function(callback) {
//TODO 
}

exports.readAllMessages = function(message, callback) {
//TODO: read all parameters async, then call the callback with a JSON dictionary payload.
}

exports.readMessage = function(message) {

  var response = {device:'unknown', parameters:[], connected:false};

  message = message.trim();
    if (debug) console.log(message);
  if (type == "unknown") {
    if (message == "USB") {
      type = "arduino";
      //response = this.arduino[message]["response"];
      if (debug) console.log("response " + response);
      response.connected = true;
      nextMessage = this.arduino[message]["next"];
      if (debug) console.log (type);
    }
    else if (message == '_WR_') {
      type = "wr5";
      //response = this.wr5[message]["response"];
      response.connected = true;
      nextMessage = this.wr5[message]["next"];
    }
    else {
      //response = "unknown device";
      console.log(response + ' |' + message + '|');
      nextMessage = "USB";
    }
  }
  else if (type == "arduino") {

    response.device = 'arduino';
    response.connected = true;

    if (message.length >= 6){
      if (this.arduino.hasOwnProperty(message.substring(0, 6))) {
        var _key = this.arduino[message.substring(0, 6)]["response"];
        if (debug) console.log("response =" + response + " key=" + _key + " value=" + ACHtoDecimal(message.substring(6)));
        response.parameters.push({"key":_key, "value":ACHtoDecimal(message.substring(6))});
        nextMessage = this.arduino[message.substring(0, 6)]["next"];
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

          response.parameters.push({key:_key,value:ACHtoDecimal(message.substring(6))});
          //response[key] = ACHtoDecimal(message.substring(6));
        }
        nextMessage = this.wr5[message.substring(0, 6)]["next"];
      }
      else {
        console.log("readMessage cannot find |" + message.substring(0, 6) + "|");
      }
    }
    else if (message == "AKR") {
      //response = this.wr5[message]["response"];
      nextMessage = this.wr5[message]["next"];
    }
    else {
      console.log("readMessage unexpected " + message);
    }
  }
  else {
    console.log("readMessage bad type " + type)
  }

  this.connected = response.connected;

  return (response);
}

exports.nextMessage = function() {
  return (nextMessage);
}

exports.reset = function() {
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