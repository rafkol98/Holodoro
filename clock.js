// AUTHOR: 210017984

//Serial communication.
let serial;
let portnName = '/dev/tty.usbmodem144401'
let inData;

// TIMER
let countDown;
let font;
var initialSeconds, initialSecondsBreak, numberSessions;
var totalSecondsForCredit = 0;
var seconds, secondsBreak;

var currentSessionNumber = 1;

var startBreak = false;

var person = true;
var pause = false; //is timer paused

// VIDEO
let video;
let detector;
let detections = [];

// var loaded = false;
var loaded = false;

// Serial controls.
var pauseButtonValue = 0;

// Firebase.
var ref;
var userLoggedIn = false;
var userID;
var sessions, secondsFocused, credit;

var waterFlag = false;

function preload() {
  font = loadFont('fonts/exo.ttf');
}

function setup() {
  setupFirebase();

  // serial communication.
  serial = new p5.SerialPort('192.168.0.4');
  serial.on('data', serialEvent);
  serial.open(portnName);

  //TODO: make user select time!
  createCanvas(windowWidth, windowHeight, WEBGL);

  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();

  video.elt.addEventListener('loadeddata', function () {
    // Load ML model.
    detector = ml5.objectDetector('cocossd', modelReady);
  }, false);

  // Write to serial that the session started - turn on the red LEDS.
  // (do not disturb).
  serial.write("session*");

  textFont(font);
  textAlign(CENTER, CENTER);
  textSize(150);
  timer();

  numberSessions = localStorage.getItem("numberSessions");
}

function draw() {
  if (currentSessionNumber <= numberSessions) {
    background(0)
    var startClock = localStorage.getItem("startClock");
   
    // if the model is loaded and the startClock flag is true, then start studying session.
    if (loaded && startClock) {
      console.log("detections length: " + detections.length)
      if (startBreak) {
        drawTimer();
      }
      // more than 0 items were detected (person), then execute appropriately.
      else if (detections.length > 0) {
        for (let i = 0; i < detections.length; i++) {
          let object = detections[i];

          // if a person was detected then execute.
          if (object.label == 'person') {
            person = true; 

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
  // When all the studying repetitions finished, return to setup page.
  else {
    serial.write("finished*");
    window.location.replace("setup.html");
  }
}

/**
 * Signal that the ML model is ready.
 */
function modelReady() {
  detector.detect(video, gotDetections);
  console.log("model ready");
  loaded = true;
}

/**
 * Got detections for ML model.
 */
function gotDetections(error, results) {
  if (error) {
    console.error(error);
  }
  detections = results;
  detector.detect(video, gotDetections);
}

/**
 * Draw the holographic timer.
 */
function drawTimer() {
  // colours change depending if working or break.
  if (startBreak) {
    fill('rgb(40,255,0)')
  } else {
    fill('rgb(0,181,226)')
  }

  var timerString = secondsToMinutes(countDown);
  var sessionString = currentSessionNumber + " of " + numberSessions;

  // Bottom
  push()
  translate(0, 320)
  rotate(radians(180))
  scale(-1, 1);
  text(timerString, 0, 0)

  textSize(50);
  translate(0, 130)
  text(sessionString, 0, 0)
  pop()

  // Top
  // textSize(150);
  push()
  translate(0, -320)
  scale(-1, 1);
  text(timerString, 0, 0)

  textSize(50);
  translate(0, 130)
  text(sessionString, 0, 0)
  pop()

  // Left
  push()
  translate(-320, 0)
  rotate(radians(-90))
  scale(-1, 1);
  text(timerString, 0, 0)

  textSize(50);
  translate(0, 130)
  text(sessionString, 0, 0)
  pop()

  // Right
  push()
  translate(300, 0)
  rotate(radians(90))
  scale(-1, 1);
  text(timerString, 0, 0)

  textSize(50);
  translate(0, 130)
  text(sessionString, 0, 0)
  pop()
}

/**
 * Timer... TODO: add more comments
 */
function timer() {

  // Number sessions repeat.
  initialSeconds = localStorage.getItem("minutesSession") * 60;
  initialSecondsBreak = localStorage.getItem("minutesBreak") * 60;

  seconds = initialSeconds;
  secondsBreak = initialSecondsBreak;
  var counter = setInterval(timer, 1000);

  function timer() {
    // if paused is false AND person is in front of the computer -> continue timer.
    if (!pause && person && !startBreak) {

      if (seconds > 0) {
        seconds = seconds - 1;
      } else if (seconds == 0) {
        // Write to serial that the session ended - play sound and turn on the green LEDS on slave.
        serial.write("piezo*");
        updateDB();
        secondsBreak = initialSecondsBreak;
        startBreak = true;
        serial.write("break*");
      }
      countDown = seconds;
    } else if (startBreak) {
      // if its the last session - no need to execute th break.
      if (currentSessionNumber != numberSessions) {
        secondsBreak = secondsBreak - 1;

        if (secondsBreak == 0) {
          // Write to serial that the break finished - play break sound and turn on the red LEDS on slave.
          serial.write("breakFinished*");
          startBreak = false;
          seconds = initialSeconds;
          currentSessionNumber++;
        }
        countDown = secondsBreak;
      } else {
        currentSessionNumber++;
      }

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
    pauseButtonValue = sensors[0];
    console.log("pause val: "+pauseButtonValue);
    // Check if the user pressed the button, if so pause the studying session.
    controlPause();
  }
}

/**
 *  Control the pause feature - if the user pressed the button.
 */
function controlPause() {
  if (pauseButtonValue == 1) {
    pause = true;
  } else {
    pause = false;
  }
}

/**
 * Update datbase after a session finished.
 */
function updateDB() {

  if (userLoggedIn) {
    // Increment seconds focused by the current session seconds.
    secondsFocused += initialSeconds;
    // add the seconds of the current session to the daily tally.
    totalSecondsForCredit += initialSeconds;
    // check if the user earned a credit.
    checkIfUpdateCredit();
    console.log(totalSecondsForCredit);
    sessions++

    console.log("seconds focused: " + secondsFocused + "sessions: " + sessions);
    // update data in the database.
    var data = {
      secondsFocused: secondsFocused,
      sessions: sessions,
      credit: credit
    }
    ref.update(data);
  }
}

/**
 * Read database information.
 */
function readDB() {
  if (userLoggedIn) {
    ref = database.ref('users').child(userID)
    // get secondsFocused of user.
    ref.child('secondsFocused').on('value', (snapshot) => {
      secondsFocused = snapshot.val();
    });


    ref.child('credit').on('value', (snapshot) => {
      // if its the first time using the app then set the credit as 1 - as they are using the app now.
      credit = snapshot.val();
      console.log("miaou credit: " + credit);
      handleCredit();
    });


    // get sessions completed of user.
    ref.child('sessions').on('value', (snapshot) => {
      sessions = snapshot.val();
    });

    handleNulls(); // handle null values in the variables - when the user uses the app for the first time.

  }
}

/**
 * Handle null value reads in the database - this only happens when its the first time the user logs in.
 */
function handleNulls() {
  if (sessions == null) {
    sessions = 0;
  }

  if (secondsFocused == null) {
    secondsFocused = 0;
  }

  if (credit == null) {
    credit = 0;
  }
  console.log("credit: " + credit);
}

/**
 * Convert seconds to minutes.
 */
function secondsToMinutes(time) {
  return str_pad_left(Math.floor(time / 60), '0', 2) + ':' + str_pad_left(time % 60, '0', 2);
}

/**
 * Pad the timer string.
 */
function str_pad_left(string, pad, length) {
  return (new Array(length + 1).join(pad) + string).slice(-length);
}

/**
 * if the player has credit - set the watering flag to true so that the system checks 
 * continually if the plants need watering - autonomous mode. 
 */
function handleCredit() {
  console.log("credit " + credit)
  if (credit > 0 && !waterFlag) {
    serial.write("autonomous*");
    waterFlag = true;
    reduceCredit();
  }
}

/**
 * Check if you can update the credit - if the student studied more than an hour.
 */
function checkIfUpdateCredit() {
  // If an hour passed of focused work, then give one watering credit.
  if (totalSecondsForCredit / 60 >= 60) {
    totalSecondsForCredit = 0;
    // increment credit and update the database.
    credit++;
    ref.child('credit').set(credit);
    handleCredit();
  }
}