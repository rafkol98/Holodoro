var input_seed,
	size,
	maxLevel,
	rot,
	lenRan,
	branchProb,
	rotRand,
	leafProb;

var hide = false,
	prog = 1,
	growing = false,
	mutating = false,
	randSeed = 80
	paramSeed = Math.floor(Math.random()*1000),
	randBias = 0;


// Firebase.
var userLoggedIn = false;
var initialisedFlag = false;
var userID;
var hours, sessions;


function setup()
{	
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

    // // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            userLoggedIn = true;
            // User logged in already or has just logged in.
            console.log(user.uid);
            userID = user.uid;
            readDB();
        }
    });
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.class("sketchStyle")
	canvas.parent('tree')
}

function readInputs(updateTree)
{	
	// variables altered by users usage of the system.

	// Every two hours focused -> another level is created in the tree.
	// There can be maximum 10 levels. Starting value 3.
	maxLevel = Math.min((3 + hours/2), 10);
	console.log("maxLevel"+maxLevel);

	// For every session the size of the tree increases. 
	// Maximum size - 250. Starting value 20.
	size = Math.min((20 + sessions), 250);


	rot =  (PI/2) / 7; // TODO: seed of user - generated when creating account
	lenRand = 0.2;
	branchProb = 1;
	rotRand = 0.1;
	leafProb = 0; // TODO: change when multiple hours
	
	if ( updateTree && !growing )
	{
		prog = maxLevel + 1;
		loop();
	}
}

function windowResized()
{
	resizeCanvas(windowWidth, windowHeight);
}

function draw()
{
	background(255, 255, 255);
	// if initialised flag - thenshow tree.
    if (initialisedFlag) {
		noStroke();
		textSize(40);
		fill('rgb(0,0,0)')
		text("Hey Rafael!", 100, 100);
		text("Hours Focused - " + hours, width - 500, 100);
		
        stroke(114,92,66);
        
        translate(width / 2, height);
        scale(1, -1);
        
        translate(0, 20);
        
        branch(1, randSeed);
		fill(0,0,0)
    }
}

function readDB() {
    if (userLoggedIn) {
		var ref = database.ref('users').child(userID);
		
		// get the number of sessions completed.
        ref.child('sessions').on('value', (snapshot) => {
            sessions = snapshot.val();
		});

		// get the total number of seconds focused.
        ref.child('secondsFocused').on('value', (snapshot) => {
			hours = converrtSecondsToHours(snapshot.val());
			initialiseTree();
		});
    }
}

function initialiseTree() {
	// initialise tree.
    if (!initialisedFlag && hours!=undefined) {
		

        readInputs(false);
        startGrow();
        initialisedFlag = true;
	} 
	// update tree if database was updated.
	else if (initialisedFlag) {
		maxLevel = Math.min((3 + hours/2), 10);
		size = 20 + sessions;
        readInputs(false);
        startGrow();
	}
}

function branch(level, seed)
{
	if ( prog < level )
		return;
	
	randomSeed(seed);
	
	var seed1 = random(1000),
		seed2 = random(1000);
		
	var growthLevel = (prog - level > 1) || (prog >= maxLevel + 1) ? 1 : (prog - level);
	
	strokeWeight(12 * Math.pow((maxLevel - level + 1) / maxLevel, 2));

	var len = growthLevel * size* (1 + rand2() * lenRand);
	
	line(0, 0, 0, len / level);
	translate(0, len / level);
	
	
	var doBranch1 = rand() < branchProb;
	var doBranch2 = rand() < branchProb;
	
	var doLeaves = rand() < leafProb;
	
	if ( level < maxLevel )
	{
		var r1 = rot * (1 + rrand() * rotRand);
		var r2 = -rot * (1 - rrand() * rotRand);
		
		if ( doBranch1 )
		{
			push();
			rotate(r1);
			branch(level + 1, seed1);
			pop();
		}
		if ( doBranch2 )
		{
			push();
			rotate(r2);
			branch(level + 1, seed2);
			pop();
		}
	}
	
	if ( (level >= maxLevel || (!doBranch1 && !doBranch2)) && doLeaves )
	{
		var p = Math.min(1, Math.max(0, prog - level));
		
		var flowerSize = (size / 100) * p * (1 / 6) * (len / level);

		strokeWeight(1);
		stroke(200 + 40 * rand2(), 240 + 20 * rand2(), 100 + 20 * rand2());
		
		rotate(-PI);
		for ( var i=0 ; i<=8 ; i++ )
		{
			line(0, 0, 0, flowerSize * (1 + 0.5 * rand2()));
			rotate(2 * PI/8);
		}
	}	
}

function startGrow()
{
	growing = true;
	prog = 1;
	grow();
}

function grow()
{
	if ( prog > (maxLevel + 3) )
	{
		prog = maxLevel + 3;
		loop();
		growing = false;
		return;
	}
	
	var startTime = millis();
	loop();
	var diff = millis() - startTime;

	prog += maxLevel / 8 * Math.max(diff, 20) / 1000;
	setTimeout(grow, Math.max(1, 20 - diff));
}


function rand()
{
	return random(1000) / 1000;
}

function rand2()
{
	return random(2000) / 1000 - 1;
}

function rrand()
{
	return rand2() + randBias;
}