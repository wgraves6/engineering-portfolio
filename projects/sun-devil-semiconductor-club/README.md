# Sun Devil Semiconductor Club

Projects connected to the Sun Devil Semiconductor Club at ASU: the club's spin coater, the network that monitors it, and my FURI research on spin-coated films.

| Project | What it is | Stack |
|---|---|---|
| [**Spin Coater Controller**](spin-coater) | Closed-loop spin coater with PID + feedforward RPM control, self-calibration, a recipe editor and vibration telemetry | C++ · Arduino · MQTT |
| [**Lab Monitoring (IIoT)**](lab-monitoring-iiot) | Arduino sensor nodes streaming equipment data to an Ignition SCADA gateway over MQTT, starting with the spin coater | Arduino · Ignition · MQTT |
| [**Spin-Coat Defect Analysis**](spin-coat-defect-analysis) | FURI research: automated time-lapse imaging and defect counting for spin-coated films, with a DOE study of process parameters | Python · OpenCV · ImageJ · JMP |
