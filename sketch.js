// AUTHOR: 210017984

//Serial communication.
let serial;
let portnName = '/dev/tty.usbmodem145401'
let inData;

// TIMER
let countDown;
let font;
var initialSeconds, initialSecondsBreak;
var seconds, secondsBreak;

var startBreak = false;

var person = true;
var pause = false; //is timer paused
var timePaused, currentTime;

// VIDEO
let video;
let detector;
let detections = [];

var loaded = false;

// Serial controls.
var ultrasound;

// Firebase.
var ref;
var userLoggedIn = false;
var userID;
var sessions, secondsFocused, lastVisit, streak;

function preload() {
  font = loadFont('fonts/exo.ttf');
}

function setup() {
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

  textFont(font);
  textAlign(CENTER, CENTER);
  textSize(170);
  timer();
}

function draw() {
  background(0)
  if (loaded) {
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
  text(timerString, 0, 0)
  pop()

  // Top
  push()
  translate(0, -300)
  text(timerString, 0, 0)
  pop()

  // Left
  push()
  translate(-300, 0)
  rotate(radians(-90))
  text(timerString, 0, 0)
  pop()

  // Right
  push()
  translate(300, 0)
  rotate(radians(90))
  text(timerString, 0, 0)
  pop()
}

/**
 * Timer... TODO: add more comments
 */
function timer() {
  initialSeconds = 10; // TODO: read it from the user.
  initialSecondsBreak = 30;

  seconds = initialSeconds; 
  secondsBreak = initialSecondsBreak;
  var counter = setInterval(timer, 1000);

  function timer() {
    // if paused is false AND person is in front of the computer -> continue timer.
    if (!pause && person && !startBreak) {
      if (seconds > 0) {
        seconds = seconds - 1;
      } else if (seconds == 0) {
        serial.write("piezo*");
        updateDB();
        secondsBreak = initialSecondsBreak;
        startBreak = true;
      }
      countDown = seconds;
    } else if (startBreak) {
      secondsBreak = secondsBreak - 1;

      if (secondsBreak == 0) {
        serial.write("break*");
        startBreak = false;
        seconds = initialSeconds;
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
    sessions++

    console.log("seconds focused: "+secondsFocused + "sessions: "+sessions);
    
    var data = {
      secondsFocused: secondsFocused,
      sessions: sessions,
      streak: streak,
      lastVisit: lastVisit
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

    //TODO: fix the streak!
    // get secondsFocused of user.
    ref.child('lastVisit').on('value', (snapshot) => {
      // if its the first time using the app then set the last visit as now.
        lastVisit = snapshot.val();
    });

    // get secondsFocused of user.
    ref.child('streak').on('value', (snapshot) => {
      // if its the first time using the app then set the streak as 1 - as they are using the app now.
        streak = snapshot.val();
    });


    // get sessions completed of user.
    ref.child('sessions').on('value', (snapshot) => {
      sessions = snapshot.val();
    });
     
    handleNulls(); // handle null values in the variables - when the user uses the app for the first time.
    handleStreak(); 
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

  if (lastVisit == null) {
    secondsFocused = new Date();
  }

  if (streak == null) {
    streak = 0;
  }

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


function handleStreak() {
  currentTime = new Date();
  const msBetweenDates = Math.abs(lastVisit - currentTime);

  var lastVisitDate = new Date(lastVisit * 1000);
  //TODO: not on the same day but have 24 hours distance between them.
  console.log("same day? "+ sameDay(currentTime, lastVisitDate));
  // Convert ms to hours.
  const hoursBetweenDates = msBetweenDates / (60 * 60 * 1000);

  if (hoursBetweenDates < 24) {
    streak++;
    ref.child('streak').set(streak);
  } else {
    ref.child('streak').set(0);
  }
}

function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}