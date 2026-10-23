# TCAD Simulations

Semiconductor process and device simulations in Silvaco TCAD: **Athena** for process simulation (oxidation, implant, diffusion, etch) and **Atlas** for device simulation (I-V, C-V, band diagrams).

<!-- TODO: hero image, e.g. a simulated device cross-section next to its I-V curve -->

## Projects

_Decks are being migrated from the Silvaco VM. Projects will be listed here as they're added._

<!-- When adding a project, replace the line above with this table:
| Project | Tool | Summary |
|---|---|---|
| [`project-name/`](project-name) | Athena / Atlas | one line: what was simulated and the key result |
-->

Each project folder follows [`_template/`](_template): `deck/` for input decks, `plots/` for exported figures and a README covering goal, setup, results and takeaways.

## Running a deck

Each project folder has its input deck in `deck/`. Open the deck in **DeckBuild** and run it. Output structures (`.str`) and logs (`.log`) are written next to the deck and can be opened in **TonyPlot**. They are git-ignored because rerunning the deck regenerates them.
