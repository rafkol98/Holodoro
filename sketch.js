// AUTHOR: 210017984

// TIMER
let countDown;
let font;
var person = false;

var pause = true; //is timer paused

// VIDEO
let video;
let detector;
let detections = [];

var loaded = false;

function preload() {
  font = loadFont('fonts/exo.ttf');
}

function setup() {

  //TODO: make user select time!
  countDown = 5*60;

  createCanvas(windowWidth, windowHeight, WEBGL);
  startTime = millis(); // start timer.

  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();

  video.elt.addEventListener('loadeddata', function() {
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
    console.log("detections length: "+ detections.length)
    // if more than 0 items were detected, then execute appropriately.
    if (detections.length > 0) {
      for (let i = 0; i < detections.length; i++) {
        let object = detections[i];
        // if a person is detected -> show counter.
        if(object.label == 'person') {
          pause = false; // pause counter.
          // TODO: remove this!
          text(object.label, object.x + 10, object.y + 24);
          // draw timer
          drawTimer();
        } 
      }
    } 
    // otherwise, if no detections were made -> we are sure there is no person
    // in the frame, therefore pause timer.
    else  {
      pause = true;
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
    translate(0,150)
    rotate(radians(180))
    text(countDown,0,0)
    pop()
  
    // Top
    push()
    translate(0,-150)
    text(countDown,0,0)
    pop()
  
  
    // Left
    push()
    translate(-150,0)
    rotate(radians(-90))
    text(countDown,0,0)
    pop()
  
    // Right
    push()
    translate(150,0)
    rotate(radians(90))
    text(countDown,0,0)
    pop()
}


/**
 * Timer... TODO: add more comments
 */
function timer() {
  var count = 26;
  var counter = setInterval(timer, 1000);

  function timer() {
    if (!pause) { //do something if not paused
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


