# 405 nm SLA Resin as a Low-Cost Photoresist

**Characterization of 405 nm UV-curable SLA resin as a photoresist for silicon photolithography.** ASU FURI research project (Fall 2026), sponsored by TSMC through FURI. Advisor: Prof. Michael Kozicki, School of Electrical, Computer and Energy Engineering.

**Research question:** How do spin-coating parameters control the thickness, wet-film stability and adhesion of a 405 nm SLA resin on silicon?

> **Status:** process characterization (lift-off and cured thickness) is done. The defect-onset DOE is in progress, and its results will be added here.

<p align="center">
  <img src="docs/images/defect_timelapse_run02_1.webp" width="70%" alt="Time-lapse of the wet resin film from 3 s to 60 min after the spin stops, with a defect opening near 1 min">
  <br><em>The same field of the wet film from 3 s to 60 min after the spin stops (capture run 02, shard 1). A defect opens between 30 s and 1 min.</em>
</p>

## Key results

- **≤ 1550 rpm** for a clean cured film. It starts peeling at 1600 rpm and is fully removed above 2100 rpm (14 runs, 6 coupons).
- **6.1–7.3 µm at 1000 rpm down to 0.8 µm at 2000 rpm** cured thickness, by Bruker Dektak XT stylus profilometry with each scan leveled in Gwyddion.
- **δ = 13.5 µm** of uncured resin lost in the IPA rinse, from a constant-loss model fit in JMP (RMSE 0.59 µm).

## Background

The Sun Devil Semiconductor Club is building a student-run photolithography process with 405 nm exposure. Consumer SLA resin is a candidate resist because it is:

- **Low cost:** about $37/kg list price, far below commercial photoresists.
- **Simple to process:** it cures at the club's 405 nm wavelength and develops in IPA.
- **Tough when cured:** ABS-like and non-brittle, so it may suit harsher processes or thicker etch masks.

A grey resin (Siraya Tech Fast) is used because clear resin exposed poorly on our setup. It is spun uncured onto acetone-cleaned Si coupons in a non-cleanroom enclosure.

### Objectives

- Determine the point of defect onset and nucleation as a function of spin coater ramp time and final speed, which sets how long a coated wafer can wait before exposure.
- Establish the final speed for a good cured film, which bounds the usable process window.
- Measure cured thickness vs. spin speed, and the thickness lost in the IPA rinse, so a target resist thickness can be dialed in.

## Results so far

Process for both tests below: 500 rpm spread for 10 s, 10 s ramp, 60 s hold; then UV for 20 s, IPA rinse for about 10 s, and UV for 60 s.

### Lift-off: maximum speed for a good film

![Lift-off result vs. spin speed](docs/images/liftoff_vs_speed.png)

The cured film is good up to 1550 rpm, starts peeling at 1600 rpm, and is fully removed above 2100 rpm (14 runs, 6 coupons).

### Cured thickness vs. spin speed

![Cured film thickness vs. spin speed with model fit](docs/images/cured_thickness_vs_speed.png)

Cured thickness drops from 6.1–7.3 µm at 1000 rpm to 0.8 µm at 2000 rpm (6 coupons).

### Why thin films wash off

![Constant-loss model](docs/images/constant_loss_model.png)

The rinse removes an uncured top layer of fixed depth δ. Films thinner than δ wash off entirely, so no film remains above 2100 rpm. The as-spun film follows k·ωⁿ, so the cured film left after the rinse is

```
h = δ[(ω/ω₀)ⁿ − 1]
```

ω₀ = 2100 rpm is fixed from the lift-off test. The fit gives **δ = 13.5 µm** and **n = −0.54**, with RMSE 0.59 µm. δ and n are 0.9994 correlated, so the fit predicts thickness well but does not pin them down separately. The dashed as-spun curve in the plot above is modeled, not measured.

<details>
<summary>JMP nonlinear fit report</summary>

![JMP nonlinear fit report](docs/images/nonlinear_fit_report.png)

</details>

### Stylus profilometry

| Bruker Dektak XT | Scan across the tape edge (1000 rpm) |
|---|---|
| ![Bruker Dektak XT stylus profilometer](docs/images/dektak_xt.jpg) | ![Dektak scan across the tape edge](docs/images/dektak_scan_1000rpm.png) |

Thickness was measured on a Bruker Dektak XT with 3 mg stylus force. Kapton tape masks each coupon and is peeled after cure, and scans start away from the resin ridge at the tape edge. The 1000 rpm scan shows a ~7 µm film plateau, a ~120 µm edge ridge, then bare Si.

### Profile analysis in Gwyddion

Each Dektak scan is processed in Gwyddion:

1. **Level.** The raw scan is tilted (the baseline slopes about 5 µm per mm). A degree-2 polynomial is fit to the bare Si only (4.33–8 mm) and subtracted, so the substrate sits at zero.
2. **Check the baseline.** On the leveled bare Si (4.61–8 mm), the mean height is ≈ 0 and Rq is 9.8 nm.
3. **Read the film.** The mean height of the film plateau, away from the ridge, is the cured thickness. Ra and Rq on the same range give film roughness.
4. **Read the ridge.** The maximum height near the tape edge gives the edge-ridge height.

| Raw scan (1000 rpm) | Polynomial leveling on bare Si |
|---|---|
| ![Raw Dektak profile in Gwyddion, tilted baseline](docs/images/gwyddion_raw_profile_1000rpm.png) | ![Gwyddion Remove Polynomial Background, degree 2 fit on 4.33–8 mm](docs/images/gwyddion_polynomial_leveling_1000rpm.png) |

| Film plateau (1000 rpm) | Film plateau (1250 rpm) |
|---|---|
| ![Gwyddion statistics on the 1000 rpm film plateau](docs/images/gwyddion_stats_film_plateau_1000rpm.png) | ![Gwyddion statistics on the 1250 rpm film plateau](docs/images/gwyddion_stats_film_plateau_1250rpm.png) |

| Speed | Plateau range | Thickness (mean) | Ra | Rq | Edge ridge (max) |
|---|---|---|---|---|---|
| 1000 rpm | 0–2.57 mm | 7.10 µm | 142 nm | 160 nm | 122 µm |
| 1250 rpm | 0–2.71 mm | 5.01 µm | 411 nm | 495 nm | ~125 µm |

The 1250 rpm ridge height is read from the plot, not from a statistics range.

<details>
<summary>Bare Si baseline and edge-ridge statistics (1000 rpm)</summary>

![Gwyddion statistics on leveled bare Si](docs/images/gwyddion_stats_si_baseline_1000rpm.png)
![Gwyddion statistics on the edge ridge](docs/images/gwyddion_stats_edge_ridge_1000rpm.png)

</details>

### Obstacles

Ellipsometry would not fit, because the ~9 µm grey film absorbs and scatters, and the film was too thick for optical profilometry. So n and k at 405 nm were not extracted.

## Defect-onset DOE (in progress)

![Defect imaging setup](docs/images/imaging_setup.jpg)

An Olympus BH microscope with a webcam on the eyepiece images the wet film. The incandescent lamp is relay-switched on only during captures to limit heating and exposure. Several frames are taken per time point, and ImageJ counts new defect sites.

| t = 0.5 min | t = 1 min |
|---|---|
| ![Wet film at 0.5 min](docs/images/wet_film_defect_t0p5min.jpg) | ![Wet film at 1 min, defect appearing](docs/images/wet_film_defect_t1min.jpg) |

*A defect appearing on the wet film between 0.5 and 1 min.*

<p align="center">
  <img src="docs/images/run02_1_t00030s_1_check.jpg" width="45%" alt="Shard at 30 s after spin stop">
  <img src="docs/images/run02_1_t03600s_1_check.jpg" width="45%" alt="Same shard at 60 min, defects outlined">
  <br><em>The same shard 30 s and 60 min after the spin stops. Yellow outlines are defects found by the ImageJ macro inside the analysis circle.</em>
</p>

**Planned design:** a 2² full factorial with 3 center points on the wet film, with dwell fixed at 60 s. The responses are onset time (time to the first defect) and nucleation (defects/mm² by a set time). The factor levels below are tentative.

| Factor | Low | Center | High |
|---|---:|---:|---:|
| Ramp time (s) | 2 | 6 | 10 |
| Final speed (rpm) | 1000 | 1750 | 2500 |

## Pipeline

```
Spin coat shard ──▶ capture/defect_imaging.py ──▶ captures/runXX_shard/*.png + log.csv
                     (camera + Opta-switched lamp,                │
                      photos on a fixed schedule from t = 0)      ▼
                                              analysis/imagej/defect_count.ijm
                                              (flat-field, threshold, count per image)
                                                                  │
                                                                  ▼
                                              defect_count.csv ──▶ JMP DOE model
```

1. **Capture.** [`capture/defect_imaging.py`](capture/defect_imaging.py) drives a USB microscope camera with fixed focus, exposure and white balance, using uncompressed YUY2 frames. It switches the illumination lamp through an Arduino Opta relay. It takes a bare-shard reference, then bursts of 3 photos at set times after the spin stops (30 s up to 60 min). Every frame is logged to CSV with its timing and lamp-on duration. The lamp is only on while shooting, so it doesn't heat the film.
2. **Lamp safety.** [`firmware/opta_lamp_relay`](firmware/opta_lamp_relay) is the Opta firmware. It takes single-character serial commands and has a hardware 30 s auto-off, so a crashed script can't leave the lamp on.
3. **Defect counting.** [`analysis/imagej/defect_count.ijm`](analysis/imagej/defect_count.ijm) keeps the green channel and divides by a heavily blurred copy to flatten uneven lighting. It then thresholds spots darker than their surroundings by a set fraction, filters by size inside a circular region of interest and writes per-image and per-timepoint averaged counts and areas. It also saves a `_check.jpg` overlay for each image so the result can be checked by eye.
4. **Design of experiments.** [`analysis/jmp/defect_doe_design.jsl`](analysis/jmp/defect_doe_design.jsl) generates the earlier four-factor screening design (covered/uncovered, ramp time 2–15 s, final speed 2000–5000 rpm, final dwell 15–120 s, 4 center points). The current plan is the two-factor design above.

## Repository layout

| Path | Contents |
|---|---|
| `capture/` | `defect_imaging.py` (timed capture), `inspection_setup.py` (live view with ROI guide for placing the shard), `lamp_capture.py` (manual capture), `opta_test.py` (relay check), `capture_rename.py` (fixes a mislabeled shard ID across a run's files and log) |
| `firmware/opta_lamp_relay/` | Arduino Opta lamp relay with safety timeout |
| `analysis/imagej/` | `defect_count.ijm` (current) and `simple_defect_count.ijm` (first version) |
| `analysis/jmp/` | DOE design script, design table, screening data and joined results tables |
| `sample_data/` | Example output from two runs: capture log, per-image counts, averaged counts and defect-tracking tables |
| `docs/images/` | Poster figures, setup photos and example defect images |

Raw capture runs are about 100 MB each and are not committed.

## Running

```bash
pip install -r requirements.txt
python capture/defect_imaging.py
```

The capture scripts are Windows-only, because camera selection uses DirectShow through `pygrabber`. Run the ImageJ macro from Fiji (*Plugins → Macros → Run*) and pick a run folder, or run it headless with the folder as the macro argument.

## Acknowledgments

Sponsored by TSMC through FURI. Thanks to Prof. Michael Kozicki and Anthony Woolson (Dektak training). In memory of Dr. Michael Goryll, who mentored this project early on.
