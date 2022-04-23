var myRec = new p5.SpeechRec('en-US', parseResult); // new P5.SpeechRec object
myRec.continuous = true; // do continuous recognition
myRec.interimResults = true; // allow partial recognition (faster, less accurate)

var minutesSession = 0;
var minutesBreak = 0;
var numberSessions = 0;

var openedClock = false;

function setup() {
    // graphics stuff:
    canvas = createCanvas(windowWidth, windowHeight);

    //myRec.onResult = parseResult; // now in the constructor
    myRec.start(); // start engine

    canvas.parent('setup')
}

function draw() {

    background(255, 255, 255);
    fill(0, 0, 0, 255);

    // instructions
    textSize(20);
    textAlign(LEFT);
    // TODO: do it in html.
    text("Set up minutes of a session by saying 'minutes' and then followed by the number of minutes you wish the session to last.", 20, 50);


    textSize(20);
    textAlign(CENTER);

    text("Minutes SESSION: " + minutesSession, windowWidth / 2, 100);
    text("Minutes BREAK: " + minutesBreak, windowWidth / 2, 150);
    text("Number of sessions: " + numberSessions, windowWidth / 2, 200);
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
