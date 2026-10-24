# Lab Monitoring (IIoT)

Arduino sensor nodes that send lab equipment data to an **Ignition SCADA** gateway over **MQTT**. Readings arrive as live tags that can be trended and alarmed on. Built for the Semiconductor Club cleanroom tools, starting with the spin coater.

```
Sensor (MPU-6050, Hall, …)
   │ I2C / GPIO
Arduino Uno R3/R4 + W5100/W5500 Ethernet shield
   │ Ethernet, MQTT (PubSubClient), JSON payloads
Ignition gateway
   ├─ MQTT Distributor  (broker, port 1883)
   └─ MQTT Engine       (messages → tags)
        │
     Tags → Perspective dashboard / historian / alarms
```

<!-- TODO: add screenshots of the Ignition tag browser and dashboard -->
<!-- ![Ignition dashboard](docs/images/dashboard.png) -->

## Sketches

| Sketch | Board | What it does |
|---|---|---|
| [`sketches/uno_w5100_mqtt_counter`](sketches/uno_w5100_mqtt_counter) | Uno R3 + W5100 | Minimal end-to-end link. Publishes `{"count":N}` every 5 s. Its [README](sketches/uno_w5100_mqtt_counter/README.md) is a full step-by-step setup guide: Arduino IDE, Ignition modules, laptop network and troubleshooting. |
| [`sketches/r4_w5500_mqtt_publish`](sketches/r4_w5500_mqtt_publish) | Uno R4 + W5500 | The same publish pattern on the R4, with JSON built by ArduinoJson. |
| [`sketches/MPU6050_ignition_upload`](sketches/MPU6050_ignition_upload) | Uno R4 + W5500 | Vibration monitoring. Samples an MPU-6050 accelerometer, subtracts the calibrated gravity vector and publishes RMS, peak and crest factor once per window. |

The full spin coater firmware, which publishes speed and vibration telemetry during runs, lives in [`../spin-coater`](../spin-coater).

## Diagnostics

Network bring-up tools for working out where a broken link is failing:

| Sketch | What it checks |
|---|---|
| [`diagnostics/uno_w5100_ping_test`](diagnostics/uno_w5100_ping_test) | DHCP with static fallback, then pings the router and the Ignition PC and tests TCP port 1883. The three results together show whether the cable/shield, the firewall or the broker is at fault. |
| [`diagnostics/ethernet_ping_test`](diagnostics/ethernet_ping_test) | ICMP ping with round-trip time on the R4 + W5500. |

## Setup

1. Install the Arduino libraries **PubSubClient** and **ArduinoJson**, plus **Ethernet2** for W5500 shields.
2. In each sketch folder, copy `config.example.h` to `config.h` and fill in the MAC address, IP addresses, broker and credentials. `config.h` is git-ignored.
3. Set up Ignition with the Cirrus Link MQTT Distributor and MQTT Engine modules. The walkthrough is in [`uno_w5100_mqtt_counter/README.md`](sketches/uno_w5100_mqtt_counter/README.md).

## Design notes

- Float fields are sent as fixed-decimal strings, so Ignition never infers an Int tag from a whole-number first message.
- Network calls are non-blocking or time-capped in anything that shares a loop with motor control.
- The W5100 has only 4 sockets, so the raw ICMP socket uses the highest one to avoid colliding with DHCP and TCP.

## Third-party code

`ICMPPing.h/.cpp` is Blake Foster's Arduino-Ping library (GPL-2.0 / LGPL-2.1), ported to Ethernet library 2.x. Its original license header is kept.
