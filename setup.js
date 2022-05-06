var myRec = new p5.SpeechRec('en-US', parseResult); // new P5.SpeechRec object
myRec.continuous = true; // do continuous recognition
myRec.interimResults = true; // allow partial recognition (faster, less accurate)

var minutesSession = "'X minutes study'";
var minutesBreak = "'Y minutes break'";
var numberSessions = "'Repeat Z times'";

var joinedDate, lastWateredPlants, secondsFocused, initialHeight, heightToday;
var openedClock = false;

let size = 550;

function setup() {
    $('#alertOne').hide();

    setupFirebase();
    // graphics stuff:
    canvas = createCanvas(windowWidth, 600);

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
    text("Say the following commands, replacing the variables with number of minutes you wish for each.", windowWidth / 2, 40);
    text("Minutes: " + minutesSession, 200, 80);
    text("Break: " + minutesBreak, 500, 80);
    text("Sessions: " + numberSessions, 800, 80);
    text("Once Ready say 'Start'", windowWidth / 2, 120);


    let startPoint = [(windowWidth / 2) + 200, size];
    let length = (600/15)*2;
    let weight = 10;
    strokeWeight(weight);
    stroke(30);
    let branchAngle = PI / 2;
    branch(startPoint, weight, length, branchAngle);
   


    let length2 = (600/30)*2;
    let startPoint2 = [(windowWidth / 2) - 200, size];
    branch(startPoint2, weight, length2, branchAngle);
    text("Height Today: 30 cm", (windowWidth / 2) + 200, 580);
    text("Initial Height: 15 cm", (windowWidth / 2) - 200, 580);
    

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
            if ((minutesSession != "'X minutes study'") && (minutesBreak != "'Y minutes break'") && (numberSessions != "'Repeat Z times'")) {
                openedClock = true;
                localStorage.setItem("startClock", true);
                window.open("./clock.html");
            } else {
                $('#alertOne').show();
            }
        }

    }
}


function branch(startPoint, weight, length, angle) {
    let x1 = startPoint[0] + length * cos(angle);
    let y1 = startPoint[1] - length * sin(angle);
    let endpoint = [x1, y1];

    strokeWeight(weight);
    line(startPoint[0], startPoint[1], endpoint[0], endpoint[1]);

    let angleMax = angle + (PI / 10);
    let angleMin = angle - PI / 10;
    let angleDiff = angleMax - angleMin - (PI / 4);
    let angle1 = angleMax - angleDiff / 5;
    let angle2 = angleMin + angleDiff / 5;
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

function readDB() {
    if (userLoggedIn) {

    var initialHeight, heightToday;
      ref = database.ref('users').child(userID)
      // get joined date of user.
      ref.child('joinedDate').on('value', (snapshot) => {
        $("#joinedDateTxt").text(snapshot.val());
      });

       // 
       ref.child('lastWateredPlants').on('value', (snapshot) => {
        $("#lastWateredTxt").text(snapshot.val());
      });

      // 
      ref.child('initialHeight').on('value', (snapshot) => {
        initialHeight = snapshot.val()
      });

       // 
       ref.child('heightToday').on('value', (snapshot) => {
        heightToday = snapshot.val()
      });

      ref.child('secondsFocused').on('value', (snapshot) => {
        $("#hoursFocusedTxt").text(snapshot.val());
      });


    }
}