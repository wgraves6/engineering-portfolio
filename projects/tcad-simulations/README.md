# TCAD Simulations

Semiconductor process and device simulations in Silvaco TCAD: **Athena** for process simulation (oxidation, implant, diffusion, etch) and **Atlas** for device simulation (I-V, C-V, band diagrams).

<!-- TODO: hero image, e.g. a simulated device cross-section next to its I-V curve -->

## Projects

| Project | Tool | Summary |
|---|---|---|
| [`gaas-rie-etch-selectivity/`](gaas-rie-etch-selectivity) | Athena | GaAs/SiO₂ RIE selectivity (6.9 : 1 blanket, ~6 : 1 in a 0.5 µm trench); JMP DOE sized a 0.171 µm mask and 9.32 min etch for a 1 µm deep trench |
| [`si-fin-thermal-oxidation/`](si-fin-thermal-oxidation) | Athena | Wet oxidation of a 0.4 µm Si fin: thins up to 41% faster than planar Deal–Grove predicts and pinches off at 60 min; oxidation used to trim or widen the fin |

Each project folder follows [`_template/`](_template): `deck/` for input decks, `plots/` for exported figures and a README covering goal, setup, results and takeaways.

## Running a deck

Each project folder has its input deck in `deck/`. Open the deck in **DeckBuild** and run it. Output structures (`.str`) and logs (`.log`) are written next to the deck and can be opened in **TonyPlot**. They are git-ignored because rerunning the deck regenerates them.
