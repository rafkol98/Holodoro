#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

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
int distance; // variable for the distance measurement

// PIEZO BUZZER
int piezoPin = 4;
float sinVal;
int toneVal;

void setup() {
  pinMode(trigPin, OUTPUT); // Sets the trigPin as an OUTPUT
  pinMode(echoPin, INPUT); // Sets the echoPin as an INPUT
 
  pinMode(piezoPin, OUTPUT); // Set up the piezo as an OUTPUT.
  
  Serial.begin(9600); // // Serial Communication is starting with 9600 of baudrate speed

  radio.begin();
  radio.setDataRate( RF24_250KBPS );
  radio.setRetries(3,5); // delay, count
  radio.openWritingPipe(slaveAddress);
}

void loop() {
  checkSerial();
  calculateDistance();
  delay(200);
}

void sendRadioData(boolean session) {
   bool rslt;
   
   if (session) {
    char sessionMessage[8] = "session";
    rslt = radio.write( &sessionMessage, sizeof(sessionMessage));
   } else {
    char sessionMessage[6] = "break";
    rslt = radio.write( &sessionMessage, sizeof(sessionMessage));
   }

acknowledge(rslt);
   
    
}

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
 * Check if for new messages on the serial port. This is used to control the LED to light up.
 */
void checkSerial() {
  if(Serial.available() > 0) {
    String getStart = Serial.readStringUntil('*');
    
    // play piezo sound, if "piezo" was received.
    if (getStart == "piezo") {
      playPiezoSound(false);
      sendRadioData(false);
    } 

    if (getStart == "session") {
      sendRadioData(true);
    } 
    
    if (getStart == "breakFinished") {
      playPiezoSound(true);
      sendRadioData(true);
    } 
    
     while(Serial.available() > 0) {
        Serial.read();
      }
  }
}
