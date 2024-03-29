// AUTHOR: 210017984
// The sketch used for the watering of the plants.
#include <Wire.h>

// if the soil is dryer than this, then start watering.
const int dry = 270;

const int pumpPin = 7;
const int soilSensor = A0;

boolean autonomousFlag = false;
boolean forceWateringFlag = false;

void setup() {
  // Declare inputs and outputs.
  pinMode(pumpPin, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(soilSensor, INPUT);
  Serial.begin(9600);
  
  Wire.begin(8);
  Wire.onRequest(requestEvent);
  Wire.onReceive(receiveEvent);
}

void loop() {
  // if force watering flag is true, then water plant once. 
  // This is achieved by setting the forceWateringFlag false once watered.
  if (forceWateringFlag) {
    forceWatering();
    forceWateringFlag = false;
  }
  // if autonomous flag is true, then keep checking.
  if (autonomousFlag) {
    digitalWrite(LED_BUILTIN, HIGH);
    autonomousWatering();
  }
}

/**
* Keep checking if the plant needs watering using the moisture sensor.
*/
void autonomousWatering() {
  digitalWrite(pumpPin, LOW);
  // read current moisture
  int moisture = averageReadings();
  
  delay(10000);
  
  if (moisture >= dry) { 
    digitalWrite(pumpPin, HIGH);
    delay(10000);
    digitalWrite(pumpPin, LOW);
    Serial.println("Watered plants: " + String(moisture));  
  } else {
    Serial.println("Moisture of plant is OK. No watering needed " + String(moisture));
  }
}

void forceWatering() {
   digitalWrite(pumpPin, HIGH);
   delay(5000);
   digitalWrite(pumpPin, LOW);
}

/**
 * Average the readings of the humidity sensor - taken over 20 seconds.
 */
int averageReadings() {
  int sum = 0;
  for(int i=0; i<20; i++) {
    sum = sum + analogRead(soilSensor);
    delay(1000);
  }
  
  // return the average value of 20 readings.
  return sum/20;
}

/**
* Determine the mode to which the watering system will run. The first flag is
* used for the forceful watering and the second for the autonomous.
*/
void receiveEvent(int howMany) {
    byte x = Wire.read();
    if(x == 0x01)
    {
       forceWateringFlag = true;
    } else if (x == 0x02) {
      autonomousFlag = true;
    }
}

/**
 * Request event used to get back the moisture from the sensor to the master.
 */
void requestEvent() {
  char buffer[7];
  int r = analogRead(soilSensor);
  // write moisture.
  Wire.write("moi;");
  Wire.write(itoa(r,buffer,10));
  Wire.write("*");
}
