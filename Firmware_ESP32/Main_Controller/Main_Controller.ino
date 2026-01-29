#include <WiFi.h>
#include <FirebaseESP32.h>
#include <DHT.h>
#include <ESP32Servo.h> 
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "secrets.h"

// --- PIN DEFINITIONS ---
#define DHTPIN 4            
#define RELAY_MAIN_PIN 5    
#define TRIG_PIN 12         
#define ECHO_PIN 13         
#define SERVO_PIN 18        
#define PIR_PIN 19          
#define RELAY_DOOR_PIN 21   

#define DHTTYPE DHT22       

// --- RELAY POLARITY ---
#define RELAY_ON LOW   
#define RELAY_OFF HIGH 

// --- OBJECTS ---
DHT dht(DHTPIN, DHTTYPE);
Servo sprayServo;
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
WiFiUDP ntpUDP;

NTPClient timeClient(ntpUDP, "pool.ntp.org", 0); 

// --- VARIABLES ---
unsigned long lastLoopTime = 0;
unsigned long lastSprayTime = 0;
bool isDoorLightOn = false;
unsigned long doorLightTimer = 0;
unsigned long sprayInterval = 60000; 

void setup() {
  // 1. Start Serial
  Serial.begin(115200);
  delay(1000); // Give serial monitor time to catch up
  Serial.println("\n\n--------------------------------");
  Serial.println("🔌 SYSTEM STARTING...");
  Serial.println("--------------------------------");
  
  // 2. Pins
  pinMode(RELAY_MAIN_PIN, OUTPUT);
  pinMode(RELAY_DOOR_PIN, OUTPUT);
  digitalWrite(RELAY_MAIN_PIN, RELAY_OFF);
  digitalWrite(RELAY_DOOR_PIN, RELAY_OFF);
  Serial.println("✅ Pins Initialized");

  pinMode(PIR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // 3. Components
  dht.begin();
  sprayServo.attach(SERVO_PIN);
  sprayServo.write(0); 
  Serial.println("✅ Sensors & Servo Ready");
  
  // 4. WiFi
  Serial.print("📡 Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 40) { // Increased wait time
    delay(500); 
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Failed! Running Offline Mode.");
  }

  // 5. Firebase
  Serial.println("☁️ Connecting to Firebase...");
  config.database_url = FIREBASE_URL;
  config.signer.tokens.legacy_token = FIREBASE_SECRET;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("✅ Firebase Initialized");

  // 6. Time
  timeClient.begin();
  Serial.println("✅ Time Client Started");
  Serial.println("--------------------------------");
  Serial.println("🚀 LOOP STARTED");
  Serial.println("--------------------------------");
}

void loop() {
  if (millis() - lastLoopTime > 2000) {
    
    // 1. SENSORS & TIME
    timeClient.update();
    unsigned long currentEpoch = timeClient.getEpochTime();
    
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (isnan(t)) t = 0.0; 
    
    bool motionDetected = digitalRead(PIR_PIN);
    
    // Ultrasonic
    long duration, distance;
    digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    duration = pulseIn(ECHO_PIN, HIGH, 30000); 
    distance = duration * 0.034 / 2;
    if (distance == 0) distance = 999; 

    // 2. FIREBASE READ
    int personCount = 0;
    bool manualOverride = false;
    double bookingStart = 0;
    double bookingEnd = 0;

    // We use 'if' checks so if Firebase fails, we keep old values
    if (Firebase.getInt(fbdo, "/seminar_hall/live_data/person_count")) personCount = fbdo.intData();
    if (Firebase.getBool(fbdo, "/seminar_hall/live_data/ac_status")) manualOverride = fbdo.boolData();
    if (Firebase.getDouble(fbdo, "/seminar_hall/live_data/booking_start")) bookingStart = fbdo.doubleData();
    if (Firebase.getDouble(fbdo, "/seminar_hall/live_data/booking_end")) bookingEnd = fbdo.doubleData();

    if (bookingStart > 2000000000) bookingStart /= 1000;
    if (bookingEnd > 2000000000) bookingEnd /= 1000;

    bool isBookingActive = (bookingStart > 0 && currentEpoch > 1000000000) && 
                           (currentEpoch >= bookingStart && currentEpoch <= bookingEnd);

    // 3. LOGIC
    bool shouldACOn = isBookingActive || manualOverride || (personCount > 0) || motionDetected;

    // 4. RELAY CONTROL
    if (shouldACOn) {
      digitalWrite(RELAY_MAIN_PIN, RELAY_ON);
    } else {
      digitalWrite(RELAY_MAIN_PIN, RELAY_OFF);
    }

    // 5. FEEDBACK
    Firebase.setBool(fbdo, "/seminar_hall/live_data/relay_active", shouldACOn);

    // 6. OTHER DEVICES
    if (personCount > 0 && (millis() - lastSprayTime > sprayInterval)) {
      Serial.println("🌸 Spraying Air Freshener!");
      sprayServo.write(120); delay(1000); sprayServo.write(0);
      lastSprayTime = millis();
    }

    if (distance < 30) {
      isDoorLightOn = true;
      doorLightTimer = millis();
      digitalWrite(RELAY_DOOR_PIN, RELAY_ON);
    }
    if (isDoorLightOn && (millis() - doorLightTimer > 15000)) {
      isDoorLightOn = false;
      digitalWrite(RELAY_DOOR_PIN, RELAY_OFF);
    }

    // 7. UPLOAD & PRINT STATUS
    Firebase.setFloat(fbdo, "/seminar_hall/live_data/temperature", t);
    if (!isnan(h)) Firebase.setFloat(fbdo, "/seminar_hall/live_data/humidity", h);

    // DEBUG PRINT (This is what you were missing!)
    Serial.print("Time: "); Serial.print(currentEpoch);
    Serial.print(" | Temp: "); Serial.print(t);
    Serial.print("C | AC Status: "); Serial.print(shouldACOn ? "ON" : "OFF");
    Serial.print(" | Reason: ");
    if(isBookingActive) Serial.print("BOOKING ");
    if(manualOverride) Serial.print("MANUAL ");
    if(personCount > 0) Serial.print("PEOPLE ");
    if(motionDetected) Serial.print("MOTION ");
    if(!shouldACOn) Serial.print("IDLE");
    Serial.println();

    lastLoopTime = millis();
  }
}