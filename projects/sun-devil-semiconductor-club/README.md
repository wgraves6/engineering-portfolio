# Sun Devil Semiconductor Club

Projects connected to the Sun Devil Semiconductor Club at ASU: the club's spin coater, the network that monitors it, and my FURI research on spin-coated films.

| Project | What it is | Stack |
|---|---|---|
| [**Spin Coater Controller**](spin-coater) | Closed-loop spin coater with PID + feedforward RPM control, self-calibration, a recipe editor and vibration telemetry | C++ · Arduino · MQTT |
| [**Lab Monitoring (IIoT)**](lab-monitoring-iiot) | Arduino sensor nodes streaming equipment data to an Ignition SCADA gateway over MQTT, starting with the spin coater | Arduino · Ignition · MQTT |
| [**Spin-Coat Defect Analysis**](spin-coat-defect-analysis) | FURI research: 405 nm SLA resin as a low-cost photoresist, with spin-speed thickness and adhesion characterization and automated defect imaging (DOE in progress) | Python · OpenCV · ImageJ · JMP · Dektak · Gwyddion |
