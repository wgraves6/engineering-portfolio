# Semiconductor Characterization

Measured process and device data, and the physical parameters extracted from it: thermal oxide growth and film metrology (Filmetrics, spectroscopic ellipsometry), reactive ion etch uniformity, and I-V characterization of discrete devices. The simulation counterparts are in [TCAD Simulations](../tcad-simulations).

| Project | Process / measurement | Summary |
|---|---|---|
| [**Wet Thermal Oxidation: Deal–Grove Fit**](thermal-oxidation-deal-grove) | Wet oxidation · Filmetrics · ellipsometry | Deal–Grove fit to furnace data (B = 0.415 µm²/hr, A = 0.272 µm), within 2% of measured except at 5 min; refractive index and uniformity of oxide vs. LPCVD nitride |
| [**SiO₂ RIE: Etch-Rate Uniformity**](sio2-rie-etch-uniformity) | CHF₃/O₂ RIE · 20-site thickness | Average etch rate 524 Å/min with 3σ = 8.2 Å/min (1.6% of the mean); slowest at one edge, fastest near the center, and the film slightly less uniform after the etch |
| [**Diode & MOSFET I-V Characterization**](device-iv-characterization) | Curve tracer · DMM · LTspice | Zener diode turn-on and breakdown voltages (within 6% of rated); CD4007 NMOS Vt, kn'(W/L), λ, ro, gm and a common-source amplifier checked against LTspice |

Each project follows [`_template/`](_template): a README covering goal, data, results and conclusions, `plots/` for the JMP figures, and `data/` for measurements as CSV where there is more data than fits in the README.

## Data sources

Each README says where its data came from: my own measurements or a course-provided dataset. The measured values are included, either as CSV in `data/` or as tables in the README, so the fits can be checked.
