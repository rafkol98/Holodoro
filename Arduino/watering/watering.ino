// if the soil is dryer than this number, then start watering
#include <Wire.h>
const int dry = 200;

const int pumpPin = 7;
const int soilSensor = A0;

boolean checkWater = false;

void setup() {
  pinMode(pumpPin, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(soilSensor, INPUT);
  Serial.begin(9600);
  
  Wire.begin(8);
  Wire.onRequest(requestEvent);
}

void loop() {
//  checkWatering();
  if (checkWater) {
    digitalWrite(LED_BUILTIN, HIGH);
    checkWatering();
    delay(10000);
  }
}

void checkWatering() {
  digitalWrite(pumpPin, LOW);
  // read current moisture
  int moisture = averageReadings();
  
  delay(1000);
  
  if (moisture >= dry) { 
    digitalWrite(pumpPin, HIGH);
    delay(5000);
    digitalWrite(pumpPin, LOW);
    Serial.println("Watered plants" + String(moisture));
    
  } else {
    Serial.println("Moisture of plant is OK. No watering needed " + String(moisture));
  }
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

void requestEvent() {
  int r = random(1,8);
  checkWater = true;
  char buffer[7];
  Wire.write("msg:");
  Wire.write(itoa(r,buffer,10));
  Wire.write("*");
}
