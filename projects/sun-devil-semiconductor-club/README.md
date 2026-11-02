# Sun Devil Semiconductor Club

My FURI research on a low-cost 405 nm photoresist for the club's student-run photolithography process, plus equipment I've helped build as the club's Equipment Team Lead.

| Project | What it is | Tools |
|---|---|---|
| [**405 nm SLA Resin as a Low-Cost Photoresist**](spin-coat-defect-analysis) | TSMC-sponsored FURI research: lift-off and cured thickness vs. spin speed, a constant-loss model for the IPA rinse, and time-lapse imaging of defect onset in the wet film (DOE in progress) | Dektak · Gwyddion · ImageJ · JMP · Python |
| [**Spin Coater Controller**](spin-coater) | Closed-loop spin coater with PID + feedforward RPM control, self-calibration, a recipe editor and vibration telemetry | C++ · Arduino |
| [**Lab Monitoring**](lab-monitoring-iiot) | Arduino sensor nodes streaming equipment data to an Ignition SCADA gateway over MQTT, starting with the spin coater | Arduino · MQTT |
