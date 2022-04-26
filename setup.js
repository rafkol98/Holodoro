var myRec = new p5.SpeechRec('en-US', parseResult); // new P5.SpeechRec object
myRec.continuous = true; // do continuous recognition
myRec.interimResults = true; // allow partial recognition (faster, less accurate)

var minutesSession = 0;
var minutesBreak = 0;
var numberSessions = 0;

var openedClock = false;

let size = 900;

function setup() {
    // graphics stuff:
    canvas = createCanvas(windowWidth, windowHeight);

    //myRec.onResult = parseResult; // now in the constructor
    myRec.start(); // start engine

    canvas.parent('setup')
}

function draw() {
    noStroke();
    background(255, 255, 255);
    fill(0, 0, 0, 255);

    // instructions
    textSize(20);
    textAlign(LEFT);

    textSize(20);
    textAlign(CENTER);

    text("Minutes SESSION: " + minutesSession, 100, 50);
    text("Minutes BREAK: " + minutesBreak, 500, 50);
    text("Number of sessions: " + numberSessions, 900, 50);


    let startPoint = [(windowWidth / 2)+200, size];
  let length = 200;
  let weight = 25;
  strokeWeight(weight);
  stroke(30);
  let branchAngle = PI / 2;
  branch(startPoint, weight, length, branchAngle);

  let length2 = 100;
  let startPoint2 = [(windowWidth / 2)-200, size];
  branch(startPoint2, weight, length2, branchAngle);
  
}

function parseResult() {
    // get most recent word.
    var mostrecentword = myRec.resultString.split(' ').pop();

    if (mostrecentword.indexOf("study") !== -1) {
        minutesSession = myRec.resultString.match(/\d+/)[0];
        localStorage.setItem("minutesSession", minutesSession); // set local variable.
    } else if (mostrecentword.indexOf("break") !== -1) {
        minutesBreak = myRec.resultString.match(/\d+/)[0];
        localStorage.setItem("minutesBreak", minutesBreak);
    } else if (mostrecentword.indexOf("times") !== -1) {
        numberSessions = myRec.resultString.match(/\d+/)[0];
        localStorage.setItem("numberSessions", numberSessions);
    } else if (mostrecentword.indexOf("start") !== -1 || mostrecentword.indexOf("ready") !== -1) {
        console.log("starting!!!")
        if (!openedClock) {
            openedClock = true;
            localStorage.setItem("startClock", true);
            window.open("./clock.html");
        }
        
    }
}


function branch(startPoint, weight, length, angle) {
    // 𝑥1=𝑥+𝑛cos𝜃
    // 𝑦1=𝑦+𝑛sin𝜃
    let x1 = startPoint[0] + length * cos(angle);
    let y1 = startPoint[1] - length * sin(angle);
    let endpoint = [x1, y1];
  
    strokeWeight(weight);
    line(startPoint[0], startPoint[1], endpoint[0], endpoint[1]);
  
    let angleMax = angle + (PI / 4);
    let angleMin = angle - PI / 4;
    let angleDiff =  angleMax - angleMin - (PI / 4);
    let angle1 = angleMax - angleDiff / 2;
    let angle2 = angleMin + angleDiff / 2;
    let newWeight = weight * 0.7;
    let newLength = length * 0.7;
  
    if (newLength < 3) {
      return;
    }
  
    branch(endpoint, newWeight, newLength, angle1);
    branch(endpoint, newWeight, newLength, angle2);
  }
  
  function randomBetween(low, high) {
    return random(high - low) + low;
  }