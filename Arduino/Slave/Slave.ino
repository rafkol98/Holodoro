// The slave or the receiver

#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

#include <Adafruit_NeoPixel.h>

#define CE_PIN   7
#define CSN_PIN 8

// Setup neopixel LEDS.
const int LEDPIN = 6;
const int NUMPIXELS = 8; // number of pixels in the adafruit LED.
Adafruit_NeoPixel pixels = Adafruit_NeoPixel(NUMPIXELS, LEDPIN, NEO_GRB + NEO_KHZ800);

const byte thisSlaveAddress[5] = {'R','x','A','A','A'};

RF24 radio(CE_PIN, CSN_PIN);

char dataReceived[10]; // this must match dataToSend in the TX
bool newData = false;

void setup() {

    Serial.begin(9600);

    Serial.println("SimpleRx Starting");
    radio.begin();
    radio.setDataRate( RF24_250KBPS );
    radio.openReadingPipe(1, thisSlaveAddress);
    radio.startListening();

    // Begin Neopixels.
    pixels.begin(); 
}

void loop() {
    getData();
    showData();
}

void getData() {
    if ( radio.available() ) {
        radio.read( &dataReceived, sizeof(dataReceived) );
        newData = true;
    }
}

void showData() {
    if (newData == true) {
      String data = String(dataReceived);
      Serial.println(dataReceived);
      
        if(data.equals("session")) {
            lightUpRED();
        } else {
          lightUpGREEN();
        }
    }
    newData = false;
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
