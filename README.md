# Engineering Portfolio

**William Graves** · Electrical Engineering, Arizona State University · B.S.E. expected May 2028

Semiconductor processing, device characterization and circuits. Each project folder has a README covering the goal, setup and results, next to the figures, data and simulation decks behind them.

**[Portfolio site](https://wgraves6.github.io/engineering-portfolio/)** · [Résumé (PDF)](assets/William_Graves_Resume.pdf) · [LinkedIn](https://www.linkedin.com/in/graves-william) · [wgraves6@asu.edu](mailto:wgraves6@asu.edu)

## Projects

### [Sun Devil Semiconductor Club](projects/sun-devil-semiconductor-club)

| Project | What it is | Tools |
|---|---|---|
| [**405 nm SLA Resin as a Low-Cost Photoresist**](projects/sun-devil-semiconductor-club/spin-coat-defect-analysis) | TSMC-sponsored FURI research: how spin speed sets the thickness and adhesion of a consumer SLA resin on Si, and when defects start forming in the wet film (DOE in progress) | Dektak · Gwyddion · ImageJ · JMP |
| [**Spin Coater Controller**](projects/sun-devil-semiconductor-club/spin-coater) | Arduino closed-loop speed control and a recipe menu for the club's photoresist spin coater, with a CNC-machined wafer chuck | C++ · Arduino |
| [**Lab Monitoring**](projects/sun-devil-semiconductor-club/lab-monitoring-iiot) | Arduino sensor nodes that send equipment readings to an Ignition SCADA gateway over MQTT, starting with the spin coater | Arduino |

### [Semiconductor Characterization](projects/semiconductor-characterization)

| Project | What it is | Tools |
|---|---|---|
| [**Wet Thermal Oxidation: Deal–Grove Fit**](projects/semiconductor-characterization/thermal-oxidation-deal-grove) | Deal–Grove constants from furnace data (B = 0.415 µm²/hr, A = 0.272 µm), within 2% of measured from 15 to 498 min; refractive index and uniformity of dry oxide, wet oxide and LPCVD nitride | JMP · Filmetrics · Ellipsometry |
| [**Diode & MOSFET I-V Characterization**](projects/semiconductor-characterization/device-iv-characterization) | Zener turn-on and breakdown voltages; CD4007 NMOS square-law parameters used in an LTspice common-source amplifier and checked against the bench circuit | Curve tracer · DMM · LTspice · JMP |

### [TCAD Simulations](projects/tcad-simulations)

| Project | What it is | Tools |
|---|---|---|
| [**GaAs RIE: Etch Selectivity & Mask Design**](projects/tcad-simulations/gaas-rie-etch-selectivity) | 6.93 : 1 blanket GaAs : SiO₂ selectivity; a JMP DOE sized a 0.171 µm oxide mask and 9.32 min etch for a 1 µm deep trench | Silvaco Athena · JMP |
| [**Thermal Oxidation of an Etched Si Fin**](projects/tcad-simulations/si-fin-thermal-oxidation) | A 0.4 µm fin thins up to 41% faster than the planar Deal–Grove prediction and pinches off at 60 min; oxidation used to trim or widen the fin | Silvaco Athena · JMP |
| [**Poly-Buffered LOCOS: Usable Active Width**](projects/tcad-simulations/poly-buffered-locos) | Silvaco's poly-buffered LOCOS example with an added oxide-extent extraction: 1.85 µm of a 2.2 µm drawn active region stays usable | Silvaco Athena |

### [Engineering Tools](projects/engineering-tools)

| Project | What it is | Tools |
|---|---|---|
| [**Circuit & lab-data helpers**](projects/engineering-tools#python) | Phasor and impedance math, Bode plots, and percent-error tables comparing calculation, LTspice and bench values | Python |
| [**JMP data-analysis scripts**](projects/engineering-tools#jmp-jsl) | Ellipsometry wafer-map contour plots and percent-error tables on JMP data tables | JSL |

## Skills

- **Process & cleanroom:** spin coating, photolithography, UV cure and IPA develop, thermal oxidation, image-based defect inspection, cleanroom protocol
- **Metrology & characterization:** Bruker Dektak XT, Gwyddion profile analysis, Filmetrics spectral reflectance, spectroscopic ellipsometry, optical microscopy, curve tracer I-V, MOSFET parameter extraction
- **Data analysis & process control:** design of experiments, JMP, SPC, nonlinear model fitting, ImageJ / Fiji, Python, MATLAB
- **Simulation:** Silvaco Athena (TCAD), LTspice
- **Circuits & electronics:** oscilloscope, function generator, DMM, LCR meter, breadboard prototyping, PCB design (KiCad)
- **Programming:** Python, MATLAB, JSL, C++ (Arduino)

## Repository layout

```
index.html, assets/                 portfolio site (GitHub Pages)
projects/
  sun-devil-semiconductor-club/     FURI photoresist research, spin coater, lab monitoring
  semiconductor-characterization/   measured process and device data
  tcad-simulations/                 Silvaco Athena decks and results
  engineering-tools/                Python and JSL helpers
```
