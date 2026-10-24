const int RELAY = D1;          // relay 2
const int RELAY_LED = LED_D1;
const unsigned long MAX_ON_MS = 30000;   // safety cutoff

bool relayOn = false;
unsigned long onSince = 0;

void setRelay(bool on) {
  relayOn = on;
  digitalWrite(RELAY, on ? HIGH : LOW);
  digitalWrite(RELAY_LED, on ? HIGH : LOW);
  if (on) onSince = millis();
  Serial.println(on ? "RELAY2 ON" : "RELAY2 OFF");
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY, OUTPUT);
  pinMode(RELAY_LED, OUTPUT);
  setRelay(false);
}

void loop() {
  if (relayOn && millis() - onSince > MAX_ON_MS) {
    Serial.println("TIMEOUT");
    setRelay(false);
  }
  if (!Serial.available()) return;
  char c = Serial.read();
  if (c == '1') setRelay(true);
  else if (c == '0') setRelay(false);
  else if (c == '?') Serial.println(relayOn ? "RELAY2 ON" : "RELAY2 OFF");
}