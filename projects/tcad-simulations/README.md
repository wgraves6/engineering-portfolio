# TCAD Simulations

Process simulations in Silvaco **Athena** (oxidation, etch, deposition), checked against hand calculations and tuned with designed experiments in JMP.

| Project | Tool | Summary |
|---|---|---|
| [**GaAs RIE: Etch Selectivity & Mask Design**](gaas-rie-etch-selectivity) | Athena · JMP | GaAs/SiO₂ RIE selectivity (6.9 : 1 blanket, ~6 : 1 in a 0.5 µm trench); a JMP DOE sized a 0.171 µm mask and 9.32 min etch for a 1 µm deep trench |
| [**Thermal Oxidation of an Etched Si Fin**](si-fin-thermal-oxidation) | Athena · JMP | Wet oxidation of a 0.4 µm Si fin: thins up to 41% faster than planar Deal–Grove predicts and pinches off at 60 min; oxidation used to trim or widen the fin |
| [**Poly-Buffered LOCOS: Usable Active Width**](poly-buffered-locos) | Athena | Silvaco's poly-buffered LOCOS example with an added oxide-extent extraction: bird's beak leaves 1.85 µm of a 2.2 µm drawn active region usable (≤ 5% pad-oxide growth) |

Each project follows [`_template/`](_template): `deck/` for input decks, `plots/` for exported figures, and a README covering goal, setup, results and conclusions.

## Running a deck

Open the deck from a project's `deck/` folder in **DeckBuild** and run it. Output structures (`.str`) and logs (`.log`) are written next to the deck and can be opened in **TonyPlot**. They are git-ignored because rerunning the deck regenerates them.
