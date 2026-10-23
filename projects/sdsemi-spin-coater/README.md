# SDSemi Spin Coater

Closed-loop controller for a DIY photoresist spin coater, built for the Semiconductor Club. An Arduino Uno R4 holds a brushed DC motor at user-programmed RPM set points, runs multi-step spin recipes from an OLED menu, calibrates its own motor curve to an SD card, and streams vibration and speed telemetry to an Ignition SCADA gateway over MQTT.

<!-- TODO: add a photo of the coater and a plot of target vs. measured RPM during a run -->
<!-- ![Spin coater](docs/images/coater.jpg) -->

## Highlights

- **PID + feedforward RPM control.** A measured PWM→RPM motor map gives the open-loop estimate. PID trims the error, with deadband, conditional integration, anti-windup, asymmetric gains and slew limits. The loop runs on a fixed 50 Hz tick so the tuned gains don't drift with display or network load.
- **Self-calibration.** The controller sweeps PWM from 30 to 255, records the average RPM at each step and saves the map to `MOTORMAP.CSV` on the SD card. It falls back to a built-in table if the card is missing.
- **Interrupt-driven tachometer.** A Hall sensor triggers a falling-edge ISR with 500 µs debounce and atomic period reads.
- **Recipe editor.** Multi-step spin profiles (idle → ramp → final speed) are edited digit by digit with a rotary encoder on a 128×64 OLED.
- **Vibration monitoring.** An MPU-6050 accelerometer reports gravity-compensated RMS, peak and crest factor over 1 s windows.
- **Non-blocking telemetry.** JSON payloads are published to Ignition over MQTT. Reconnects are rate-limited, socket timeouts are capped and publishing gives up after 30 s, so a missing broker never stalls the motor.

## Repository layout

| Path | Contents |
|---|---|
| [`firmware/improved_spin_coater/`](firmware/improved_spin_coater) | The production firmware. Its [README](firmware/improved_spin_coater/README.md) documents every module, the state machine, the control loop, the pin map and the I2C bus map. |
| [`prototypes/`](prototypes) | Earlier bring-up sketches for each component (motor driver, displays, encoder, Hall sensor, IMU, SD card) that led to the final firmware. |
| [`hardware/chuck-cam/`](hardware/chuck-cam) | CNC G-code for machining the wafer chuck. |

The network side (MQTT broker setup, Ignition tags, connectivity diagnostics) lives in [`../lab-monitoring-iiot`](../lab-monitoring-iiot).

## Hardware

| Component | Part |
|---|---|
| MCU | Arduino Uno R4 + Ethernet shield (W5100/W5500, on-board SD slot) |
| Motor driver | XY160D H-bridge |
| Speed sensor | Hall-effect sensor, 1 magnet/rev |
| UI | SSD1306 128×64 OLED + Modulino rotary encoder (I2C) |
| Vibration | GY-521 (MPU-6050) |

The full pin and I2C address map is in the [firmware README](firmware/improved_spin_coater/README.md#pin-map).

## Building

1. Install Arduino IDE 2.x and the libraries **PubSubClient**, **ArduinoJson**, **Adafruit SSD1306** and **Adafruit GFX**. Ethernet, SD and Wire come with the IDE.
2. Copy `firmware/improved_spin_coater/config.example.h` to `config.h` in the same folder, then fill in your network and MQTT settings. `config.h` is git-ignored.
3. Open `improved_spin_coater.ino`, select the Uno R4 board and upload.

## Software architecture

```
APP_MENU ──Start Spin──▶ APP_SPIN ──done──┐
   │  ▲                                    │
   │  └──────────────── resetToRoot ◀──────┘
   ├──Edit──────▶ APP_EDIT_PROFILE
   └──Calibrate─▶ APP_CALIBRATE
```

Menu callbacks only set deferred flags. The main loop applies the state change afterward, which avoids re-entrant transitions inside a callback.
