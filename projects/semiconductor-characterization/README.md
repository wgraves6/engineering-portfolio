# Semiconductor Characterization

Measured process and device data, and the physical parameters extracted from it: thermal oxide growth and film metrology (Filmetrics, spectroscopic ellipsometry), and I-V characterization of discrete devices. The simulation counterparts are in [TCAD Simulations](../tcad-simulations).

| Project | Process / measurement | Summary |
|---|---|---|
| [**Wet Thermal Oxidation: Deal–Grove Fit**](thermal-oxidation-deal-grove) | Wet oxidation · Filmetrics · ellipsometry | Deal–Grove fit to furnace data (B = 0.415 µm²/hr, A = 0.272 µm), within 2% of measured except at 5 min; refractive index and uniformity of oxide vs. LPCVD nitride |
| [**Diode & MOSFET I-V Characterization**](device-iv-characterization) | Curve tracer · DMM · LTspice | Zener diode turn-on and breakdown voltages (within 6% of rated); CD4007 NMOS Vt, kn'(W/L), λ, ro, gm and a common-source amplifier checked against LTspice |

Each project follows [`_template/`](_template): a README covering goal, data, results and conclusions, `plots/` for the JMP figures, and `data/` for measurements as CSV where there is more data than fits in the README.

## Data sources

Each README says where its data came from: my own measurements or a course-provided dataset. The measured values are included, either as CSV in `data/` or as tables in the README, so the fits can be checked.
