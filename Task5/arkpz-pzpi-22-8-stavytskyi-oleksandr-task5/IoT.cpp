#include <WiFi.h>
#include <HTTPClient.h>
#include <PubSubClient.h> 


int trigPin = 32;
int echoPin = 22;
int ledPinGreen = 18;
int ledPinRed = 19;

char* ssid = "Wokwi-GUEST";  
char* password = ""; 

char* mqtt_server = "broker.emqx.io"; 
int mqtt_port = 1883;
char* mqtt_user = ""; 
char* mqtt_password = ""; 
char* mqtt_topic = "parking/status";  


WiFiClient espClient;
PubSubClient client(espClient);


void reconnect() {

  while (!client.connected()) {

    if (client.connect("ESP32", mqtt_user, mqtt_password)) {

      client.subscribe(mqtt_topic);

    } else {

      delay(5000);
    }
  }
}

void setup() {

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(ledPinGreen, OUTPUT);
  pinMode(ledPinRed, OUTPUT);


  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.println("Підключення до Wi-Fi...");
  }
  Serial.println("Підключено до Wi-Fi!");


  client.setServer(mqtt_server, mqtt_port);
  reconnect();
}

void loop() {

  if (!client.connected()) {
    reconnect();
  }
  client.loop();


  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);


  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);


  unsigned long duration = pulseIn(echoPin, HIGH);


  long distance = duration * 0.0344 / 2;


  Serial.print("Дистанція: ");
  Serial.print(distance);
  Serial.println(" cm");


  bool spotStatus = false;
  if (distance < 100) {  
    digitalWrite(ledPinGreen, HIGH); 
    digitalWrite(ledPinRed, LOW);     
    spotStatus = true; 
  } else {
    digitalWrite(ledPinRed, HIGH);  
    digitalWrite(ledPinGreen, LOW);
    spotStatus = false; 
  }


  if (WiFi.status() == WL_CONNECTED) {
      int sensorId = 1; 
      String payload = "{\"sensor_id\":" + String(sensorId) + ",\"spot_status\":";
      payload += spotStatus ? "true" : "false";
      payload += "}";

      client.publish(mqtt_topic, payload.c_str());  
      Serial.println("Відправка даних...");

  } else {
      Serial.println("Wi-Fi не підключено!");
  }


  delay(1000);  
}
