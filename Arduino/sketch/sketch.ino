// The main sketch used to control the holographic clock.
#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

#include <Wire.h>
int topPossibleValue = 127;
byte error, add;

// Radio pins.
#define CE_PIN   7
#define CSN_PIN 8

const byte slaveAddress[5] = {'R','x','A','A','A'};

RF24 radio(CE_PIN, CSN_PIN); // Create a Radio

char txNum = '0';

// ULTRASONIC
int echoPin = 2;
const int trigPin = 3;
long duration; // variable for the duration of sound wave travel
double distance; // variable for the distance measurement

// PIEZO BUZZER
int piezoPin = 10;
float sinVal;
int toneVal;

boolean pause = false;

void setup() {
  pinMode(4, INPUT_PULLUP); // pull up button - for pause.
    
  pinMode(trigPin, OUTPUT); // Sets the trigPin as an OUTPUT
  pinMode(echoPin, INPUT); // Sets the echoPin as an INPUT
 
  pinMode(piezoPin, OUTPUT); // Set up the piezo as an OUTPUT.
  
  Serial.begin(9600); // // Serial Communication is starting with 9600 of baudrate speed

  radio.begin();
  radio.setDataRate( RF24_250KBPS );
  radio.setRetries(3,5); // delay, count
  radio.openWritingPipe(slaveAddress);

  Wire.begin();
}

void loop() {
  checkSerial();
  checkPauseButton();
  Serial.print(pause);
  Serial.println(";");
  delay(200);
}

/**
* Send radio data to the wireless slave.
*/
void sendRadioData(int status) {
   bool rslt;

   // turn LEDs red - session.
   if (status == 1) {
    char sessionMessage[8] = "session";
    rslt = radio.write( &sessionMessage, sizeof(sessionMessage));
   } 
   // turn LEDs green - break.
   else if(status == 0) {
    char sessionMessage[6] = "break";
    rslt = radio.write( &sessionMessage, sizeof(sessionMessage));
   } 
   // turn off LEDs - finished all sessions.
   else {
    char sessionMessage[9] = "finished";
    rslt = radio.write( &sessionMessage, sizeof(sessionMessage));
   }

acknowledge(rslt);
      
}

/**
* Acknowledge that the data has been sent.
*/
void acknowledge(boolean rslt) {
  Serial.print("Data Sent ");
    if (rslt) {
        Serial.println("  Acknowledge received");
    }
    else {
        Serial.println("  Tx failed");
    }
}

/**
 * Calculate distance from sensor using ultrasonic sound.
 */
void calculateDistance() {
  double sumDistance = 0;
  // Get the average of distance over 40 readings - to avoid bad readings.
  for (int i=0; i<40; i++) {
    // Clears the trigPin condition.
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
  
    // Sets the trigPin HIGH for 10 microseconds.
    digitalWrite(trigPin, HIGH);  
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
  
    // read ECHO and return sound wave travel time in seconds. This is used to calculate distance.
    duration = pulseIn(echoPin, HIGH); 
   
    sumDistance += duration * 0.034 / 2;
  }

  // get the average distance.
  // Height of stand - height of plant 
  distance = 45 - (sumDistance / 40);

  // Print the distance to serial.
  Serial.print("height;"); 
  Serial.print(distance);  
  Serial.println(";");  
}

/*
* Play piezo sound - sound depends on whether studying or break finished.
*/
void playPiezoSound(boolean isBreakOver) {
  if (isBreakOver) {
    tone(piezoPin, 800, 1000);
    delay(100);
    digitalWrite(piezoPin,LOW);
    delay(100);  
    tone(piezoPin, 1500, 1000);
    delay(100);
    digitalWrite(piezoPin,LOW);
    delay(100);  
  } else {
    tone(piezoPin, 300, 2000);
    delay(100);
    digitalWrite(piezoPin,LOW);
    delay(100);  
  }
}


/**
 * Invert the pause button flag whenever the button is pressed.
 */
void checkPauseButton() {
    int sensorVal = digitalRead(4);
    // check for low because using input pullup -> reverse.
    if (sensorVal == LOW) {
      pause = !pause;
    }  
}

  /**
 * Check if for new messages on the serial port. This is used to control the LED to light up.
 */
void checkSerial() {
  if(Serial.available() > 0) {
    String getStart = Serial.readStringUntil('*');

    if (getStart == "height") {
       calculateDistance();
    } 
    
    // play piezo sound, if "piezo" was received.
    if (getStart == "piezo") {
      playPiezoSound(false);
      sendRadioData(0);
    } 

    // Initial Case - Session started turn on led lights to red.
    if (getStart == "session") {
      sendRadioData(1);
    } 
    
    if (getStart == "breakFinished") {
      playPiezoSound(true);
      sendRadioData(1);
    }

    if (getStart == "moisture") {
      getFromSlave();
     }

     // force watering.
     if (getStart == "force") {
      wateringSlave(false);
     }

    // autonomous mode watering.
    if (getStart == "autonomous") {
      wateringSlave(true);
     }
     
     
    // When all sessions are finished turn off leds.
    if (getStart == "finished") {
      sendRadioData(-1);
    } 
  
     while(Serial.available() > 0) {
        Serial.read();
      }
  }
}

/**
* Get message from wired slave - watering.
*/
void getFromSlave() {
  delay(2000);

  byte a,b;
  Wire.requestFrom(8,7, false);

  while(Wire.available()) {
    char c = Wire.read();
    // if message is not * (42 - ascii), print the message.
    if (c != 42) {
      Serial.print(c);
    } else {
      Serial.print(",");
    }
  }

  Serial.println(";");
  delay(1000);
}

/**
 * Water plant. If autonomous flag is set to true then the system runs autonomously,
 * only watering the plant if its needed.
 */
void wateringSlave(boolean autonomous) {
  Wire.beginTransmission(8);
  if (autonomous) {
    Wire.write(0x02);     
  } else {
    Wire.write(0x01); 
  }
      
  Wire.endTransmission();
  Serial.println("Sent");
}
