Waterrower
==========
An interface to the Waterrower rowing machine. Connect the Waterrower display to your system using the Micro USB socket. Values in the Waterrower display are read asynchronously and made available to the API. The values will start at 0, and as they are transferred the values will be updated. It usually takes 3-4 seconds for this to happen.

The node module does its best to identify the port that the Waterrower is using, and this has always worked with the limited number of systems at our disposal. They are MAC OS/10, Raspbian, Ubunutu and Windows. See below for troubleshooting.

Simple API currently exposes: Stroke Rate, Total Speed, Average Speed, Distance, Heart Rate. This example use will display the Waterrower values and update them every 2 seconds.


```
var waterrower = require("./Waterrower");

var readWaterrower = function() {
  console.log();
  console.log("Stroke Rate ....." + waterrower.readStrokeCount());  // [ - ]
  console.log("Total Speed ....." + waterrower.readTotalSpeed());   // [cm/s]
  console.log("Average Speed ..." + waterrower.readAverageSpeed()); // [cm/s]
  console.log("Distance... ....." + waterrower.readDistance());     // [ m ]
  console.log("Heart Rate ......" + waterrower.readHeartRate());    // [ bpm ]

}
```

Troubleshooting
---------------
In the Waterrower module index.js file change debug to true. Restarting your program will show the ports that have been found. For example, on a MAC :

```
// Read Waterrower
//
// Initialise
var debug = true;

Output:
$ node index.js 
in readWrite closed call open
Number of ports=3
com name /dev/cu.Bluetooth-Incoming-Port
port ID 
com name /dev/cu.Bluetooth-Modem
port ID 
com name /dev/cu.usbserial-A800etv2
port ID 
in readWrite open call read
in read connecting to /dev/cu.usbserial-A800etv2
Stroke Rate ....................0
Total Speed ....................0
Average Speed ..................0
Distance... ....................0
Heart Rate .....................0
in readWrite connecting
in read open
```
