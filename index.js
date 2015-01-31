var waterrower = require("./Waterrower");
 
var readWaterrower = function() {

  console.log("Stroke Rate ...................." + waterrower.readStrokeCount());
  console.log("Total Speed ...................." + waterrower.readTotalSpeed());
  console.log("Average Speed .................." + waterrower.readAverageSpeed());
  console.log("Distance... ...................." + waterrower.readDistance());
  console.log("Heart Rate ....................." + waterrower.readHeartRate());

}

setInterval(readWaterrower, 2000);