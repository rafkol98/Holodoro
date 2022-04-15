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
	randSeed = 80,
	paramSeed = Math.floor(Math.random()*1000),
	randBias = 0;


// Firebase.
var userLoggedIn = false;
var initialisedFlag = false;
var userID;
var hours;


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
    canvas = createCanvas(700, 700);
    canvas.class("sketchStyle")

   
    canvas.parent('tree')
    
}

function readInputs(updateTree)
{
	maxLevel = 10; // TODO: variable
	rot =  (PI/2) / 7; // TODO: seed of user - generated when creating account
	lenRand = 0.2;
	branchProb = 0.9;
	rotRand = 0.1;
	leafProb = 0.5; // TODO: change when multiple hours
	
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
    initialiseFlock();
    if (initialisedFlag) {

    

        stroke(114,92,66);
	
        background(255, 255, 255);
    
        
        translate(width / 2, height);
        scale(1, -1);
        
        translate(0, 20);
        
        branch(1, randSeed);
        fill(0,0,0)
    }


}

function readDB() {
    if (userLoggedIn) {
        var ref = database.ref('users').child(userID).child('hours');
        ref.on('value', (snapshot) => {
            const data = snapshot.val();
            hours = data;

            console.log("hours" + hours);
        });
    }
}

function initialiseFlock() {
    if (!initialisedFlag && hours!=undefined) {
        size = hours;
        readInputs(false);
        startGrow();
        initialisedFlag = true;
        console.log("meow");
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