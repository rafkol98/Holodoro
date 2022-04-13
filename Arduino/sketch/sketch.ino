// ULTRASONIC
int echoPin = 2;
const int trigPin = 3;
long duration; // variable for the duration of sound wave travel
int distance; // variable for the distance measurement

void setup() {
  pinMode(trigPin, OUTPUT); // Sets the trigPin as an OUTPUT
  pinMode(echoPin, INPUT); // Sets the echoPin as an INPUT
  Serial.begin(9600); // // Serial Communication is starting with 9600 of baudrate speed
}

void loop() {
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
