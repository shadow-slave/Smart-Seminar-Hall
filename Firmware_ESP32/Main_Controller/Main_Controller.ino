#include <WiFi.h>
#include <FirebaseESP32.h>
#include <DHT.h>
#include <ESP32Servo.h> 
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "secrets.h"

// --- PIN DEFINITIONS ---
#define DHTPIN 4            // Temperature Sensor (Data)
#define RELAY_MAIN_PIN 5    // Channel 1: Main AC Control
#define TRIG_PIN 12         // Ultrasonic Trig
#define ECHO_PIN 13         // Ultrasonic Echo
#define SERVO_PIN 18        // Air Freshener Servo
#define PIR_PIN 19          // Motion Sensor
#define RELAY_DOOR_PIN 21   // Channel 2: Door Light

#define DHTTYPE DHT22       // Change to DHT11 if using blue sensor

// --- RELAY SETTINGS (Active LOW Fix) ---
// Your relay turns ON with 0 (LOW) and OFF with 1 (HIGH)
#define RELAY_ON LOW
#define RELAY_OFF HIGH

// --- OBJECTS ---
DHT dht(DHTPIN, DHTTYPE);
Servo sprayServo;
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
WiFiUDP ntpUDP;

// Time Client: Set to UTC (0) to match React's global timestamps
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0); 

// --- VARIABLES ---
unsigned long lastLoopTime = 0;
unsigned long lastSprayTime = 0;
bool isDoorLightOn = false;
unsigned long doorLightTimer = 0;

// DEMO MODE: Spray every 60 seconds (1 Minute)
unsigned long sprayInterval = 60000; 

void setup() {
  Serial.begin(115200);
  
  // 1. Setup Pins (Start OFF to prevent startup clicks)
  pinMode(RELAY_MAIN_PIN, OUTPUT);
  pinMode(RELAY_DOOR_PIN, OUTPUT);
  
  // Force OFF immediately
  digitalWrite(RELAY_MAIN_PIN, RELAY_OFF);
  digitalWrite(RELAY_DOOR_PIN, RELAY_OFF);

  pinMode(PIR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // 2. Initialize Components
  dht.begin();
  
  // Servo Startup Test (Shows it's working)
  sprayServo.attach(SERVO_PIN);
  Serial.println("🤖 Servo Check...");
  sprayServo.write(180); delay(500);
  sprayServo.write(0);   delay(500);
  
  // 3. Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\n✅ WiFi Connected!");

  // 4. Connect to Firebase
  config.database_url = FIREBASE_URL;
  config.signer.tokens.legacy_token = FIREBASE_SECRET;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // 5. Start Time Client
  timeClient.begin();
}

void loop() {
  // Run logic every 2 seconds (Non-blocking delay)
  if (millis() - lastLoopTime > 2000) {
    
    // --- STEP A: SENSORS & TIME ---
    timeClient.update();
    unsigned long currentEpoch = timeClient.getEpochTime(); // Current Time in Seconds
    
    // Read Temp
    float t = dht.readTemperature();
    if (isnan(t)) t = 0.0; 
    
    // Read Motion
    bool motionDetected = digitalRead(PIR_PIN);
    
    // Read Ultrasonic (With 30ms Timeout Fix)
    long duration, distance;
    digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms max wait
    distance = duration * 0.034 / 2;
    if (distance == 0) distance = 999; 

    // --- STEP B: FIREBASE DATA SYNC ---
    int personCount = 0;
    bool manualOverride = false;
    double bookingStart = 0;
    double bookingEnd = 0;

    // Fetch Data
    if (Firebase.getInt(fbdo, "/seminar_hall/live_data/person_count")) {
      personCount = fbdo.intData();
    }
    if (Firebase.getBool(fbdo, "/seminar_hall/live_data/ac_status")) {
      manualOverride = fbdo.boolData();
    }
    if (Firebase.getDouble(fbdo, "/seminar_hall/live_data/booking_start")) {
        bookingStart = fbdo.doubleData();
    }
    if (Firebase.getDouble(fbdo, "/seminar_hall/live_data/booking_end")) {
        bookingEnd = fbdo.doubleData();
    }

    // TIMESTAMP CONVERSION: React sends Milliseconds, ESP needs Seconds
    if (bookingStart > 2000000000) bookingStart /= 1000;
    if (bookingEnd > 2000000000) bookingEnd /= 1000;

    // Check if Meeting is Happening NOW
    bool isBookingActive = (currentEpoch >= bookingStart) && (currentEpoch <= bookingEnd);

    // --- STEP C: THE "BRAIN" (Priority Logic) ---
    // AC ON if: (Meeting Active) OR (Manual Switch ON) OR (People Detected) OR (Motion Detected)
    bool shouldACOn = isBookingActive || manualOverride || (personCount > 0) || motionDetected;

    if (shouldACOn) {
      digitalWrite(RELAY_MAIN_PIN, RELAY_ON); // Turns ON (LOW)
      
      // Update Dashboard Logic
      if (!manualOverride) Firebase.setBool(fbdo, "/seminar_hall/live_data/ac_status", true);
      
    } else {
      digitalWrite(RELAY_MAIN_PIN, RELAY_OFF); // Turns OFF (HIGH)
      
      if (manualOverride) Firebase.setBool(fbdo, "/seminar_hall/live_data/ac_status", false);
    }

    // --- STEP D: AIR FRESHENER (1 Minute Demo) ---
    // Rule: Must see people AND 1 minute passed
    if (personCount > 0 && (millis() - lastSprayTime > sprayInterval)) {
      Serial.println("🌸 Spraying Air Freshener!");
      sprayServo.write(180); 
      delay(1000);           
      sprayServo.write(0);   
      lastSprayTime = millis(); 
    }

    // --- STEP E: DOOR LIGHT (Proximity) ---
    if (distance < 30) {
      isDoorLightOn = true;
      doorLightTimer = millis();
      digitalWrite(RELAY_DOOR_PIN, RELAY_ON); 
    }
    // Auto-off after 15 seconds
    if (isDoorLightOn && (millis() - doorLightTimer > 15000)) {
      isDoorLightOn = false;
      digitalWrite(RELAY_DOOR_PIN, RELAY_OFF); 
    }

    // --- STEP F: UPLOAD TEMP ---
    Firebase.setFloat(fbdo, "/seminar_hall/live_data/temperature", t);
    
    // Debug Print
    Serial.printf("🌡 %.1fC | 👥 %d | 📅 Book: %s | ⚡ AC: %s\n", 
      t, personCount, isBookingActive ? "YES" : "NO", shouldACOn ? "ON" : "OFF");
    
    lastLoopTime = millis();
  }
}