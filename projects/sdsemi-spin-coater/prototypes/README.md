# Prototypes

Bring-up sketches written while building the coater. Each one tests a single component on its own before it went into [`firmware/improved_spin_coater`](../firmware/improved_spin_coater). They are kept to show how the design evolved. They are not maintained.

| Sketch | What it tested | Became |
|---|---|---|
| `spin_coater_old`, `spin_coater` | First open-loop motor control through the H-bridge | `XY160D` driver, closed-loop `RPMController` |
| `hall_effect_sensor_test` | Interrupt-based RPM measurement | `HallSensorRPM` |
| `oled_driver_code`, `display_rotenc_test` | SSD1306 OLED output and rotary encoder input | `OLEDLineDisplay`, `MenuUI` |
| `qwiic_i2c_test` | I2C bus scanner for finding device addresses | I2C bus map |
| `three_button_test`, `spin_coater_misc_drivers_test` | I2C button board and button debouncing | Replaced by the Modulino knob |
| `joystick_test` | Analog joystick input | Not used |
| `4_digit_display_test`, `4_digit_display_driver` | TM1637 7-segment display with blinking digit cursor | Removed in favor of the OLED digit editor |
| `MPU6050_test` | MPU-6050 accelerometer/gyro driver | `Mpu6050` vibration statistics |
| `ethernet_sd_test` | SD card and Ethernet sharing one SPI bus | `SdLogger`, `MotorMap` persistence |
