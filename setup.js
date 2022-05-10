//Serial communication.
let serial;
let portnName = '/dev/tty.usbmodem144401'
let inData;

var myRec = new p5.SpeechRec('en-US', parseResult); // new P5.SpeechRec object
myRec.continuous = true; // do continuous recognition
myRec.interimResults = true; // allow partial recognition (faster, less accurate)

var minutesSession = "'X minutes study'";
var minutesBreak = "'Y minutes break'";
var numberSessions = "'Repeat Z times'";
var wateredTimestamp;

var credit, moisture, initialHeight, heightToday, heightMeasured;
var openedClock = false;
var watered = false;


let size = 550;

function setup() {
    $('#alertOne').hide();

    // serial communication.
    serial = new p5.SerialPort('192.168.0.4');
    serial.on('data', serialEvent);
    serial.open(portnName);

    serial.write("moisture*");

    setupFirebase();
    // graphics stuff:
    canvas = createCanvas(windowWidth, 600);

    //myRec.onResult = parseResult; // now in the constructor
    myRec.start(); // start engine

    canvas.parent('setup')
}

function draw() {
    // measure height of tree.
    if (!heightMeasured) {
        serial.write("height*");
    }

    calculateGrowthToday();

    noStroke();
    background(255, 255, 255);
    fill(0, 0, 0, 255);

    // instructions
    textSize(20);
    textAlign(LEFT);

    textSize(20);
    textAlign(CENTER);
    text("Say the following commands, replacing the variables with number of minutes you wish for each.", windowWidth / 2, 40);
    text("Minutes: " + minutesSession, windowWidth / 2 - 400, 80);
    text("Break: " + minutesBreak, windowWidth / 2, 80);
    text("Sessions: " + numberSessions, windowWidth / 2 + 400, 80);
    text("Once Ready say 'Start'", windowWidth / 2, 120);


    let startPoint = [(windowWidth / 2) + 200, size];
    let length = (600 / 15) * 2;
    let weight = 10;
    strokeWeight(weight);
    stroke(30);
    let branchAngle = PI / 2;
    branch(startPoint, weight, length, branchAngle);


    let length2 = (600 / 30) * 2;
    let startPoint2 = [(windowWidth / 2) - 200, size];
    branch(startPoint2, weight, length2, branchAngle);
    text("Height Today: " + heightToday + " cm", (windowWidth / 2) + 200, 580);
    text("Initial Height: "+ initialHeight + " cm", (windowWidth / 2) - 200, 580);
}

function parseResult() {
    // get most recent word.
    var mostrecentword = myRec.resultString.split(' ').pop();
    
    // if said the word "water" send a command to water the plants.
    if (mostrecentword.indexOf("water") !== -1 && !watered) {
        console.log("water!")
        watered = true;
       
        if (parseInt(credit) > 0) {
            // force watering.
            serial.write("force*");
            reduceCredit();
        }
    } 

    // if said the word "study" get the number of minutes for session.
    if (mostrecentword.indexOf("study") !== -1) {
        minutesSession = myRec.resultString.match(/\d+/)[0];
        localStorage.setItem("minutesSession", minutesSession); // set local variable.
    } 
    // if said the word "break" get the number of minutes for the break.
    else if (mostrecentword.indexOf("break") !== -1) {
        minutesBreak = myRec.resultString.match(/\d+/)[0];
        localStorage.setItem("minutesBreak", minutesBreak);
    } 
    // if said the word "times" get the number of sessions.
    else if (mostrecentword.indexOf("times") !== -1) {
        numberSessions = myRec.resultString.match(/\d+/)[0];
        localStorage.setItem("numberSessions", numberSessions);
    } 
    // if said the word "start" or "ready" - then start the session.
    else if (mostrecentword.indexOf("start") !== -1 || mostrecentword.indexOf("ready") !== -1) {
        console.log("starting!!!")
        if (!openedClock) {
            // if all of the parameters were set, start the session.
            if ((minutesSession != "'X minutes study'") && (minutesBreak != "'Y minutes break'") && (numberSessions != "'Repeat Z times'")) {
                openedClock = true;
                localStorage.setItem("startClock", true);
                window.open("./clock.html");
            } 
            // if any of the parameters was not set then show notification to the user.
            else {
                $('#alertOne').show();
            }
        }

    }
}

/**
 * Create the branch of the tree. 
 * Basis taken from: https://justinpoliachik.com/posts/2021-09-13-generativetrees01/
 */
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

/**
 * Calculate the growth of the plant today.
 */
function calculateGrowthToday() {

    if (initialHeight != undefined) {
        var growth = heightToday - initialHeight;
        $("#plantGrowthTxt").text(growth.toFixed(2));
    } 
}
/**
 * Read firebase database.
 */
function readDB() {
    if (userLoggedIn) {

        ref = database.ref('users').child(userID)
        // get joined date of user.
        ref.child('credit').on('value', (snapshot) => {
            credit = snapshot.val();
            $("#creditTxt").text(credit);
        });

        ref.child('sessions').on('value', (snapshot) => {
            $("#sessionsTxt").text(snapshot.val());
        });

        // Get initial height of the plant.
        ref.child('initialHeight').on('value', (snapshot) => {
            initialHeight = snapshot.val()
            // if initial height is undefined -> it means its the first time we are reading
            // the height of the tree --> write it to the database.
            if (initialHeight == undefined) {
                ref.child('initialHeight').set(heightToday);
            }
        });

        ref.child('secondsFocused').on('value', (snapshot) => {
            $("#hoursFocusedTxt").text(converrtSecondsToHours(snapshot.val()) + " Hours");
        });
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

        // if length is 3 -> then read the height.
        if (sensors.length == 3) {
            if (sensors[0] == "height") {
                heightToday = sensors[1];
                console.log("height today " + heightToday);
                heightMeasured = true;
            } 
            
            if (sensors[0] == "moi"){
                moisture =  sensors[1];
                $("#moistureTxt").text(moisture);
                console.log("moisture " + moisture);
            }
        }
    }
}
/**
 * Reduce the credit whenever the user uses the water command.
 */
function reduceCredit() {
    ref = database.ref('users').child(userID)

    credit = credit - 1;
    ref.child('credit').set(credit);
}