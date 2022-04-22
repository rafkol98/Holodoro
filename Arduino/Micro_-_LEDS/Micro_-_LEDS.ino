#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

#include <Adafruit_NeoPixel.h>

// Setup neopixel LEDS.
const int LEDPIN = 6;
const int NUMPIXELS = 8; // number of pixels in the adafruit LED.
Adafruit_NeoPixel pixels = Adafruit_NeoPixel(NUMPIXELS, LEDPIN, NEO_GRB + NEO_KHZ800);

// Communication
RF24 radio(9, 8); // CE, CSN
const byte address[6] = "00001"; // address 

void setup() {
  while(!Serial); 
    Serial.begin(9600);

  // Communication between arduinos.
  radio.begin();
  radio.openReadingPipe(0, address); // set the address
  radio.startListening();  // set module as receiver

  // Begin Neopixels.
  pixels.begin(); 
}

void loop() {
   // Read the data if available in buffer
  if(radio.available()) {
     char text[32] = {0}; 
     radio.read(&text, sizeof(text));
     Serial.println(text);
  } 

   lightUpRED();
}

void lightUpGREEN() {
  for(int i=0; i< NUMPIXELS;i++) {
    pixels.setPixelColor(i, pixels.Color(0,255,0)); // green 
  }
  pixels.show();
}

void lightUpRED() {
  for(int i=0; i< NUMPIXELS;i++) {
    pixels.setPixelColor(i, pixels.Color(255,0,0)); // red 
  }
  pixels.show();
}
