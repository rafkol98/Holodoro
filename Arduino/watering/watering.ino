#include <Wire.h>

// if the soil is dryer than this, then start watering.
const int dry = 270;

const int pumpPin = 7;
const int soilSensor = A0;

boolean checkWater = false;
boolean forceWateringFlag = false;

void setup() {
  pinMode(pumpPin, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(soilSensor, INPUT);
  Serial.begin(9600);
  
  Wire.begin(8);
  Wire.onRequest(requestEvent);
  Wire.onReceive(receiveEvent);
}

void loop() {
//  readFromMaster();
  // if force watering flag is true, then water plant once.
  if (forceWateringFlag) {
    forceWatering();
    forceWateringFlag = false;
  }
  
  if (checkWater) {
    digitalWrite(LED_BUILTIN, HIGH);
    checkWatering();
//    delay(10000);
  }
}

void checkWatering() {
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
   delay(10000);
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

//void readFromMaster() {
//  while(Wire.available()) {
//    char c = Wire.read();
//    // if message is not * (42 - ascii), print the message.
//    if (c != 42) {
//      Serial.print(c);
//    } else {
//      Serial.print(",");
//    }
//
//    digitalWrite(LED_BUILTIN, HIGH);
//  }
//
//  Serial.println("");
//  delay(1000);
//}

void receiveEvent(int howMany)
{
    byte x = Wire.read(); //getting from receive FIFO Buffer
    if(x == 0x28)
    {
       digitalWrite(LED_BUILTIN, HIGH);
    }
}

void requestEvent() {
 
  if (!checkWater) {
    checkWater = true;
  } 
  // if called the second time, then it means that
  // the user request
  else {
    forceWateringFlag = true;
  }
  
  char buffer[7];
  int r = analogRead(soilSensor);
  Wire.write("msg:");
  Wire.write(itoa(r,buffer,10));
  Wire.write("*");
}
