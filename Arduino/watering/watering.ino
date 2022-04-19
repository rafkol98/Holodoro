// if the soil is dryer than this number, then start watering
const int dry = 270;

const int pumpPin = 3;
const int soilSensor = A0;

void setup() {
  pinMode(pumpPin, OUTPUT);
  pinMode(soilSensor, INPUT);
  Serial.begin(9600);
  digitalWrite(pumpPin, HIGH);
  delay(5000);
}

void loop() {
  // read current moisture
  int moisture = analogRead(soilSensor);
  Serial.println(moisture);
  delay(100000);



  
  if (moisture >= dry) { 
    digitalWrite(pumpPin, LOW);
    delay(5000);
    digitalWrite(pumpPin, HIGH);

//    // the soil is too dry, water!
//    Serial.println("Watering starts now..moisture is " + String(moisture));
//    digitalWrite(pumpPin, LOW);
//
//    // keep watering for 5 sec
//    delay(100);
//
//    // turn off water
//    digitalWrite(pumpPin, HIGH);
//    Serial.println("Done watering.");
  } else {
    Serial.println("Moisture is adequate. No watering needed " + String(moisture));
  }
}
