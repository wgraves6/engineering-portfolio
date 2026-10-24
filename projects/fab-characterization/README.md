# Fabrication & Characterization

Cleanroom process and metrology data, with the analysis I did on it: thermal oxidation, thin-film deposition, and thickness and optical measurements (Filmetrics, spectroscopic ellipsometry). The simulation counterparts are in [TCAD Simulations](../tcad-simulations).

## Projects

| Project | Process / measurement | Summary |
|---|---|---|
| [`thermal-oxidation-deal-grove/`](thermal-oxidation-deal-grove) | Wet oxidation · Filmetrics · ellipsometry | Deal–Grove fit to furnace data (B = 0.415 µm²/hr, A = 0.272 µm), within 2% of measured except at 5 min; refractive index and uniformity of oxide vs. LPCVD nitride |

Each project folder follows [`_template/`](_template): `data/` for raw measurements as CSV, `analysis/` for the scripts that turn them into results, `plots/` for figures, and a README covering goal, data, analysis, results and takeaways.

## Data sources

Each README says where its data came from: my own measurements or a course-provided dataset. Raw data is kept as plain CSV so every fit and figure can be reproduced from the repo.
