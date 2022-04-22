// TRANSMITTER
#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

RF24 radio(7, 8); // CE, CSN

const byte address[6] = "00001";

void setup() {
  Serial.begin(9600); // // Serial Communication is starting with 9600 of baudrate speed
  
  radio.begin();
  radio.openWritingPipe(address);
  radio.setPALevel(RF24_PA_MAX); 
  radio.stopListening();
}

void loop() {
  writeRadio();
  delay(1000);
}


void writeRadio() {
  const char text[] = "Hello World";
  radio.write(&text, sizeof(text));
  Serial.println("Sent");
  delay(1000);
  
}

 /**
 * Check if for new messages on the serial port. This is used to control the LED to light up.
 */
void checkSerial() {
  if(Serial.available() > 0) {
    String getStart = Serial.readStringUntil('*');
    
    // play piezo sound, if "piezo" was received.
    if (getStart == "session") {
      writeRadio();
    } 
    
     while(Serial.available() > 0) {
        Serial.read();
      }
  }
}
