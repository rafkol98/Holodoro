// if the soil is dryer than this number, then start watering
const int dry = 270;

const int pumpPin = 3;
const int soilSensor = A0;

void setup() {
  pinMode(pumpPin, OUTPUT);
  pinMode(soilSensor, INPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(pumpPin, LOW);
  // read current moisture
  int moisture = averageReadings();
  delay(1000);
  
  if (moisture >= dry) { 
    digitalWrite(pumpPin, HIGH);
    delay(5000);
    Serial.println("Watered plants");
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
