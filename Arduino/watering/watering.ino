// if the soil is dryer than this number, then start watering
const int dry = 270;

const int pumpPin = 7;
const int soilSensor = A0;

void setup() {
  pinMode(pumpPin, OUTPUT);
  pinMode(soilSensor, INPUT);
  Serial.begin(9600);
  Serial1.begin(115200); // ESP-01 module operates at 115200 baud rate
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
    // WRITE TO DATABASE.
    
  } else {
    Serial.println("Moisture of plant is OK. No watering needed " + String(moisture));
  }

//  readAT();
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


void readAT() {
  while(Serial1.available()>0) // While the data output is available on the Serial1 interface(the ESP-01 module)
    Serial.write(Serial1.read());//Write it into the Serial Monitor
  while(Serial.available()>0) // while the data is available input is available in the Serial Interface
    Serial1.write(Serial.read());//Send it to the ESP-01 Module
}
