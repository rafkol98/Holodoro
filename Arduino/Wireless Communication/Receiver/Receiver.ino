// RECEIVER
#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

RF24 radio(2, SS); // CE, CSN

const byte address[6] = "00001";

void setup() {
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(LED_BUILTIN, OUTPUT);
  while(!Serial); 
    Serial.begin(9600);
    
  radio.begin();
  radio.openReadingPipe(0, address);
  radio.setPALevel(RF24_PA_MAX);  
  radio.startListening();
}

void loop() {
  if (radio.available()) {
    char text[32] = {0}; 
    radio.read(&text, sizeof(text)); 
    Serial.println(text);
    blinkLED();
  }
}

void blinkLED() {
  digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(1000);                       // wait for a second
  digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
  delay(1000);    
}
