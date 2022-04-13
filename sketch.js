// AUTHOR: 210017984

//Serial communication.
let serial;
let portnName = '/dev/tty.usbmodem145401'
let inData;

// TIMER
let countDown;
let font;

var person = true;
var pause = false; //is timer paused

// VIDEO
let video;
let detector;
let detections = [];

var loaded = false;

// Serial controls.
var ultrasound;

function preload() {
  font = loadFont('fonts/exo.ttf');
}

function setup() {
  // serial communication.
  serial = new p5.SerialPort('192.168.0.4')
  serial.on('data', serialEvent);
  serial.open(portnName);

  //TODO: make user select time!

  createCanvas(windowWidth, windowHeight, WEBGL);
  startTime = millis(); // start timer.

  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();

  video.elt.addEventListener('loadeddata', function () {
    // Load ML model.
    detector = ml5.objectDetector('cocossd', modelReady);
  }, false);

  textFont(font);
  textAlign(CENTER, CENTER);
  textSize(50);
  fill('rgb(255,0,0)')
  timer();

}

function draw() {
  background(0)
  if (loaded) {
    console.log("detections length: " + detections.length)
    // if more than 0 items were detected, then execute appropriately.
    if (detections.length > 0) {
      for (let i = 0; i < detections.length; i++) {
        let object = detections[i];
        // if a person is detected -> show counter.
        if (object.label == 'person') {
          person = true; // pause counter.

          // if pause is false and person is true -> show timer.
          if (!pause) {
            // draw timer
            drawTimer();
          }
       
        }
      }
    }
    // otherwise, if no detections were made -> we are sure there is no person
    // in the frame, therefore pause timer.
    else {
      person = false;
    }
  }
}

function modelReady() {
  detector.detect(video, gotDetections);
  console.log("model ready");
  loaded = true;
}

function gotDetections(error, results) {
  if (error) {
    console.error(error);
  }
  detections = results;
  detector.detect(video, gotDetections);
}

function drawTimer() {
  // Bottom
  push()
  translate(0, 150)
  rotate(radians(180))
  text(countDown, 0, 0)
  pop()

  // Top
  push()
  translate(0, -150)
  text(countDown, 0, 0)
  pop()


  // Left
  push()
  translate(-150, 0)
  rotate(radians(-90))
  text(countDown, 0, 0)
  pop()

  // Right
  push()
  translate(150, 0)
  rotate(radians(90))
  text(countDown, 0, 0)
  pop()
}


/**
 * Timer... TODO: add more comments
 */
function timer() {
  var count = 26;
  var counter = setInterval(timer, 1000);

  function timer() {
    // if paused is false AND person is in front of the computer -> continue timer.
    if (!pause && person) {
      count = count - 1;
      if (count < 0) {
        clearInterval(counter);
        setTimeout(timer, 5000); //start count from 26 again
        return;
      }

      countDown = count;
    }
  }
}


/**
 * Read a string from the serial port until newline is encountered.
 */
function serialEvent() {
  var inString = serial.readStringUntil('\r\n');

  if (inString.length > 0) {
    // Split the string to read values.
    var sensors = split(inString, ';');
    ultrasound = sensors[0];
    console.log('ultrasound' + ultrasound);

    // Check the ultrasound sensor and act appropriately.
    controlUltrasound();
  }
}


/**
 *  Control the ultrasound sensor.
 */
function controlUltrasound() {
  // if object is within 20 centimeters of the sensor -> pause screen (if not paused).
  // if the screen was already paused -> unpause (toggle boolean).
  if (ultrasound <= 20) {
    pause = !pause;
  } 
  
  console.log("controlUltrasound"+ pause + " ultrasound: "+ ultrasound);
}
