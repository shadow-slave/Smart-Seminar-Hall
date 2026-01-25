#include <WiFi.h>
#include <FirebaseESP32.h>
#include <DHT.h>
#include <ESP32Servo.h>
#include <NTPClient.h> // ✅ Added for Time
#include <WiFiUdp.h>   // ✅ Added for Time
#include "secrets.h" 

// --- 1. PIN DEFINITIONS ---
#define DHTPIN 4        
#define DHTTYPE DHT22   
#define RELAY_PIN 5     
#define SERVO_PIN 18    
#define PIR_PIN 19      

// --- 2. OBJECTS ---
DHT dht(DHTPIN, DHTTYPE);
Servo sprayServo;
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Time Setup (UTC+5:30 for India = 19800 seconds offset)
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800); 

// --- 3. VARIABLES ---
unsigned long lastSensorTime = 0;
int personCount = 0;
bool acStatus = false;
unsigned long triggerTime = 0; // Holds the booking timestamp from Firebase

void setup() {
  Serial.begin(115200);
  
  // Hardware Setup
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(PIR_PIN, INPUT);
  digitalWrite(RELAY_PIN, HIGH); // Start with Relay OFF (Active Low)
  
  dht.begin();
  sprayServo.attach(SERVO_PIN);
  
  // WiFi Connection
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\n✅ WiFi Connected!");

  // Firebase Connection
  config.database_url = FIREBASE_URL;
  config.signer.tokens.legacy_token = FIREBASE_SECRET;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Start Time Client
  timeClient.begin();
}

void loop() {
  // --- A. GET TIME & BOOKING DATA ---
  timeClient.update();
  unsigned long currentEpoch = timeClient.getEpochTime();

  // Get the Booking Trigger Time from Firebase
  // (React calculates this: Booking Time - 30 mins)
  if (Firebase.getInt(fbdo, "/seminar_hall/booking/trigger_time")) {
    // Only update if value is valid and different
    if (fbdo.dataType() == "int" || fbdo.dataType() == "float") {
       long newTrigger = fbdo.intData();
       if (newTrigger != triggerTime) {
          triggerTime = newTrigger;
          Serial.println("📅 New Booking Sync Received!");
       }
    }
  }

  // --- B. READ SENSORS (Every 2 Seconds) ---
  if (millis() - lastSensorTime > 2000) {
    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (!isnan(h) && !isnan(t)) {
      Firebase.setFloat(fbdo, "/seminar_hall/live_data/temperature", t);
      Firebase.setFloat(fbdo, "/seminar_hall/live_data/humidity", h);
    }
    lastSensorTime = millis();
  }

  // --- C. READ CROWD COUNT ---
  if (Firebase.getInt(fbdo, "/seminar_hall/live_data/person_count")) {
    personCount = fbdo.intData();
  }

  // --- D. MASTER AUTOMATION LOGIC ---
  
  bool isBookingActive = false;

  // Check 1: Is it Booking Time?
  if (triggerTime > 0) {
      // If current time is PAST the start time
      if (currentEpoch >= triggerTime) {
          
          // Auto-Cancel after 2 hours (2 * 3600 seconds) to save electricity
          if (currentEpoch > triggerTime + 7200) {
              Serial.println("⏹ Meeting Over - Resetting Trigger");
              triggerTime = 0;
              Firebase.setInt(fbdo, "/seminar_hall/booking/trigger_time", 0);
              isBookingActive = false;
          } else {
              isBookingActive = true;
          }
      }
  }

  // Check 2: Are People Present?
  bool arePeoplePresent = (personCount > 0);

  // FINAL DECISION: Turn AC ON if (Booking is Active) OR (People are Present)
  if (isBookingActive || arePeoplePresent) {
    digitalWrite(RELAY_PIN, LOW); // Relay ON (Active Low)
    if (!acStatus) {
      Serial.println("❄️ COOLING ACTIVE (Reason: " + String(isBookingActive ? "Booking" : "Crowd") + ")");
      acStatus = true;
      Firebase.setBool(fbdo, "/seminar_hall/live_data/ac_status", true);
    }
  } else {
    digitalWrite(RELAY_PIN, HIGH); // Relay OFF
    if (acStatus) {
      Serial.println("🛑 COOLING OFF (Room Empty & No Booking)");
      acStatus = false;
      Firebase.setBool(fbdo, "/seminar_hall/live_data/ac_status", false);
    }
  }
}