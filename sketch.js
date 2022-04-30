// AUTHOR: 210017984

//Serial communication.
let serial;
let portnName = '/dev/tty.usbmodem145401'
let inData;

// TIMER
let countDown;
let font;
var initialSeconds, initialSecondsBreak, numberSessions;
var totalSecondsToday = 0;
var seconds, secondsBreak;

var currentSessionNumber = 1;

var startBreak = false;

var person = true;
var pause = false; //is timer paused
var timePaused, currentTime;

// VIDEO
let video;
let detector;
let detections = [];

// var loaded = false;
var loaded = false;

// Serial controls.
var ultrasound;

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
  serial = new p5.SerialPort('192.168.0.4')
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
  textSize(170);
  timer();

  numberSessions = localStorage.getItem("numberSessions"); 
}

function draw() {
  if (currentSessionNumber <= numberSessions) {
    background(0)
    var startClock = localStorage.getItem("startClock");
    if (loaded && startClock) {
      console.log("detections length: " + detections.length)
      // if more than 0 items were detected, then execute appropriately.
  
      if (startBreak) {
        drawTimer();
      }
      else if (detections.length > 0) {
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
  } else {
    window.location.replace("setup.html");
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
  // colours change depending if working or break.
  if (startBreak) {
    fill('rgb(40,255,0)')
  } else{
    fill('rgb(0,181,226)')
  }
  
  var timerString = secondsToMinutes(countDown);

  // Bottom
  push()
  translate(0, 300)
  rotate(radians(180))
  scale(-1,1);
  text(timerString, 0, 0)
  pop()

  // Top
  push()
  translate(0, -300)
  scale(-1,1);
  text(timerString, 0, 0)
  pop()

  // Left
  push()
  translate(-300, 0)
  rotate(radians(-90))
  scale(-1,1);
  text(timerString, 0, 0)
  pop()

  // Right
  push()
  translate(300, 0)
  rotate(radians(90))
  scale(-1,1);
  text(timerString, 0, 0)
  pop()
}

/**
 * Timer... TODO: add more comments
 */
function timer() {

  //TODO: number sessions repeat.
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
      secondsBreak = secondsBreak - 1;

      if (secondsBreak == 0) {
        // Write to serial that the break finished - play break sound and turn on the red LEDS on slave.
        serial.write("breakFinished*");
        startBreak = false;
        seconds = initialSeconds;
        currentSessionNumber++;
      }
      countDown = secondsBreak;
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
  currentTime = new Date(); // get current time.

  // if object is within 20 centimeters of the sensor -> pause screen (if not paused).
  // if the screen was already paused -> unpause (toggle boolean).
  if (ultrasound <= 20) {
    // if time paused = undefined -> first time trying to pause.
    // otherwise if 2 seconds passed since the pause then you can unpause.
    if ((timePaused == undefined) || ((currentTime - timePaused) > 2000)) {
      pause = !pause;
      timePaused = new Date(); // set the timestamp when the pomodoro session was paused.
    }
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
    totalSecondsToday += initialSeconds;
    checkIfUpdateCredit();
    sessions++

    console.log("seconds focused: "+secondsFocused + "sessions: "+sessions);
    
    var data = {
      secondsFocused: secondsFocused,
      sessions: sessions,
      credit: credit
    }
    ref.set(data);
  }
}

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
    });


    // get sessions completed of user.
    ref.child('sessions').on('value', (snapshot) => {
      sessions = snapshot.val();
    });
     
    handleNulls(); // handle null values in the variables - when the user uses the app for the first time.
    handleCredit(); 
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
  console.log("credit: "+ credit);
}

/**
 * Convert seconds to minutes.
 */
function secondsToMinutes(time){
  return  str_pad_left(Math.floor(time / 60),'0',2) + ':' + str_pad_left(time % 60,'0',2);
}

/**
 * Pad the timer string.
 */
function str_pad_left(string,pad,length) {
  return (new Array(length+1).join(pad)+string).slice(-length);
}

/**
 * if the player has credit - set the watering flag to true so that the system checks 
 * continually if the plants need watering. 
 */
function handleCredit() {
  if (credit > 0 && !waterFlag) {
    serial.write("water*");
  }
}

function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}


function setupFirebase()
{
  // Configuration of firebase.
  const firebaseConfig = {
    apiKey: "AIzaSyDp73X5Dv95oRglSHSbsdeC67iykPH0bx8",
    authDomain: "holodoro-4d629.firebaseapp.com",
    databaseURL: "https://holodoro-4d629-default-rtdb.firebaseio.com",
    projectId: "holodoro-4d629",
    storageBucket: "holodoro-4d629.appspot.com",
    messagingSenderId: "644743674668",
    appId: "1:644743674668:web:399d42bfa528290a6dca89",
    measurementId: "G-FW5WR4HL00"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  database = firebase.database();
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      userLoggedIn = true;
      // User logged in already or has just logged in.
      console.log(user.uid);
      userID = user.uid;
    
      // Read DB.
      readDB();
    }
  });
}

function checkIfUpdateCredit() {
  // TODO: make it 60 - to be an hour.
  if (secondsToMinutes(totalSecondsToday) >= 1) {
    // increment credit and update the database.
    credit++;
    ref.child('credit').set(credit);
  }
}