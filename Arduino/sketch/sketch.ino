// ULTRASONIC
int echoPin = 2;
const int trigPin = 3;
long duration; // variable for the duration of sound wave travel
int distance; // variable for the distance measurement

// PIEZO BUZZER
int piezoPin = 8;
float sinVal;
int toneVal;

void setup() {
  pinMode(trigPin, OUTPUT); // Sets the trigPin as an OUTPUT
  pinMode(echoPin, INPUT); // Sets the echoPin as an INPUT
  
  pinMode(piezoPin, OUTPUT); // Set up the piezo as an OUTPUT.

  Serial.begin(9600); // // Serial Communication is starting with 9600 of baudrate speed
  
}

void loop() {
  checkSerial();
  calculateDistance();
 
  delay(200);
}


/**
 * Calculate distance from sensor using ultrasonic sound.
 */
void calculateDistance() {
  // Clears the trigPin condition.
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  // Sets the trigPin HIGH for 10 microseconds.
  digitalWrite(trigPin, HIGH);  
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // read ECHO and return sound wave travel time in seconds. This is used to calculate distance.
  duration = pulseIn(echoPin, HIGH); 
  distance = duration * 0.034 / 2;

  // Print the distance to serial.
  Serial.print(distance);  
  Serial.println(";");  
}

void playPiezoSound() {
//  for (int i=0; i<4; i++) {
//    for (int x=0; x<180; x++) {
//      // convert degrees to radians then obtain sin value
//      sinVal = (sin(x*(3.1412/180)));
//      // generate a frequency from the sin value
//      toneVal = 2000+(int(sinVal*1000));
//      tone(8, toneVal);
//      delay(2);
//    }
//  }
  tone(piezoPin, 300, 2000);
  delay(100);
  digitalWrite(piezoPin,LOW);
  delay(100);  
}


  /**
 * Check if for new messages on the serial port. This is used to control the LED to light up.
 */
void checkSerial() {
  if(Serial.available() > 0) {
    String getStart = Serial.readStringUntil('*');
    
    // light up the primary colour led.
    if (getStart == "piezo") {
      playPiezoSound();
    } 

     while(Serial.available() > 0) {
        Serial.read();
      }
  }
}