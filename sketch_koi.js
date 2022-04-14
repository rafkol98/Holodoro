class FlockParams {
    constructor() {
        this.maxForce = 3
        this.maxSpeed = 2.7
        this.perceptionRadius = 150
        this.alignAmp = 0.5
        this.cohesionAmp = 1
        this.separationAmp = 3
    }
}

let flockParams = new FlockParams()

class Koi {
    constructor(x, y, koiColor, oppositeColor) {
        this.color = color(koiColor)
        this.offsetX = random(-100, 100)
        this.offsetY = random(-100, 100)
        this.oppositeColor = color(oppositeColor)
        this.position = createVector(x + this.offsetX, y + this.offsetY)
        this.velocity = p5.Vector.random2D()
        this.velocity.setMag(random(2, 10))
        this.acceleration = createVector()
        this.maxForce = flockParams.maxForce
        this.maxSpeed = flockParams.maxSpeed
        this.baseSize = hours
        this.bodyLength = this.baseSize * 3
        this.body = new Array(this.bodyLength).fill({ ...this.position })
    }

    calculateDesiredSteeringForce(kois, factorType) {
        let steering = createVector()
        let total = 0
        for (let other of kois) {
            let d = dist(
                this.position.x,
                this.position.y,
                other.position.x,
                other.position.y
            )
            if (d < flockParams.perceptionRadius && other != this) {
                switch (factorType) {
                    case 'align':
                        steering.add(other.velocity)
                        break;
                    case 'cohesion':
                        steering.add(other.position)
                        break;
                    case 'separation':
                        let diff = p5.Vector.sub(this.position, other.position)
                        diff.div(d)
                        steering.add(diff)
                        break;
                    default:
                        break;
                }
                total++
            }
        }

        if (total > 0) {
            steering.div(total)
            if (factorType === 'cohesion') steering.sub(this.position)
            steering.setMag(flockParams.maxSpeed)
            steering.sub(this.velocity)
            steering.limit(flockParams.maxForce)
        }
        return steering
    }

    align = kois => this.calculateDesiredSteeringForce(kois, 'align')

    cohesion = kois => this.calculateDesiredSteeringForce(kois, 'cohesion')

    separation = kois => this.calculateDesiredSteeringForce(kois, 'separation')

    avoid(obstacle) {
        let steering = createVector()
        let d = dist(
            this.position.x,
            this.position.y,
            obstacle.x,
            obstacle.y
        )
        if (d < flockParams.perceptionRadius) {
            let diff = p5.Vector.sub(this.position, obstacle)
            diff.div(d)
            steering.add(diff)
            steering.setMag(flockParams.maxSpeed)
            steering.sub(this.velocity)
            steering.limit(flockParams.maxForce)
        }
        return steering
    }

    edges() {
        if (this.position.x > width + 50) {
            this.position.x = -50
        } else if (this.position.x < -50) {
            this.position.x = width + 50
        }
        if (this.position.y > height + 50) {
            this.position.y = -50
        } else if (this.position.y < -50) {
            this.position.y = height + 50
        }
    }

    flock(kois) {
        this.acceleration.mult(0)
        let alignment = this.align(kois)
        let cohesion = this.cohesion(kois)
        let separation = this.separation(kois)

        let mouseObstacle = createVector(mouseX, mouseY)
        let avoid = this.avoid(mouseObstacle)

        alignment.mult(flockParams.alignAmp)
        cohesion.mult(flockParams.cohesionAmp)
        separation.mult(flockParams.separationAmp)

        this.acceleration.add(avoid)
        this.acceleration.add(separation)
        this.acceleration.add(alignment)
        this.acceleration.add(cohesion)

        this.acceleration.add(p5.Vector.random2D().mult(.05))
    }

    updateBody() {
        this.body.unshift({ ...this.position })
        this.body.pop()
    }

    show() {
        noStroke()
        this.body.forEach((b, index) => {

            let size
            if (index < this.bodyLength / 6) {
                size = this.baseSize + index * 1.8
            } else {
                size = this.baseSize * 2 - index
            }
            this.color.setAlpha(20)

            fill(this.color)
            ellipse(b.x, b.y, size, size)

        })
    }

    update() {
        this.baseSize = hours
        this.bodyLength = this.baseSize * 3

        this.position.add(this.velocity)
        this.velocity.add(this.acceleration)
        this.velocity.limit(flockParams.maxSpeed)
        this.updateBody()
    }
}

const flock = []
const koiNumber = 2

// Firebase.
var userLoggedIn = false;
var initialisedFlag = false;
var userID;
var hours;

function setup() {
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

        }
    });

    
    createCanvas(windowWidth, windowHeight)

    
}

function draw() {
    background(203, 196, 175)
    readDB();
    initialiseFlock();

    if (initialisedFlag) {
        textSize(40);
        fill('rgb(0,0,0)')
        text("Hey Rafael!", 100, 100);
        text("HOURS FOCUSED - " + hours, width - 500, 100);
    
        fill(183, 176, 155)
        circle(width / 2 - 10, height / 2 + 15, width / 4 + 10)
        fill(224, 45, 40)
        circle(width / 2, height / 2, width / 4)
    
        flock.forEach(koi => {
            koi.edges()
            koi.flock(flock)
            koi.update()
            koi.show()
        });
    }


}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    background(230);
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
        const centerX = random(width - 200, 200)
        const centerY = random(height - 200, 200)
    
        const whiteColor = '#FFFFFF'
        const blackColor = '#020202'
        flock.push(new Koi(centerX, centerY, whiteColor, blackColor));
        flock.push(new Koi(centerX, centerY, blackColor, whiteColor));
        initialisedFlag = true;
        console.log("meow");
    }
}
