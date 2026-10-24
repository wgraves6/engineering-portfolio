#include <Wire.h>

void setup() {
  Serial.begin(9600);
  delay(1000);

  Wire.begin();

  Serial.println("Scanning I2C bus...");
}

void loop() {
  byte count = 0;

  for (byte i = 1; i < 127; i++) {
    Wire.beginTransmission(i);
    if (Wire.endTransmission() == 0) {
      Serial.print("Found: 0x");
      Serial.println(i, HEX);
      count++;
      delay(10);
    }
  }

  if (count == 0) {
    Serial.println("No I2C devices found");
  } else {
    Serial.println("Done");
  }

  Serial.println("-------------------");
  delay(3000);
}