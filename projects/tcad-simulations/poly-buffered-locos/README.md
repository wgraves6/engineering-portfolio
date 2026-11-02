# Poly-Buffered LOCOS: Bird's Beak and Usable Active Width

**Tool:** Silvaco Athena · **Course / context:** EEE 435 (Fundamentals of CMOS and MEMS Processing), ASU, homework.

**Source:** The process deck is Silvaco's built-in example `anoxex05` (Examples → Athena_OXIDATION → Poly Buffered LOCOS), run unchanged. **My part:** one added `extract` line that measures how far the field oxide encroaches into the active region, and the usable-length analysis below.

<p align="center">
  <img src="plots/final_pbl_cross_section.png" width="70%" alt="Simulated poly-buffered LOCOS cross-section after field oxidation">
  <br><em>Poly-buffered LOCOS after 120 min wet oxidation at 1000 °C (half of the active region).</em>
</p>

## Key results

- **1.85 µm** of the **2.2 µm** drawn active region stays usable after field oxidation, taking ≤ 5% pad-oxide growth as the limit.
- The usable edge comes from the added `extract` line: the lateral SiO₂ extent at y = 0.021 µm is 1.276 µm.

## Goal

LOCOS isolation grows a thick field oxide everywhere the nitride mask is removed, but oxide also grows sideways under the nitride edge (the bird's beak). This eats into the active region. Poly-buffered LOCOS (PBL) adds a polysilicon layer between the pad oxide and nitride to reduce that effect. The goal was to run the PBL process and find how much of the drawn active region is still usable after field oxidation.

## Setup

The simulation covers half of the active region: the right edge (x = 0.7 µm) is the center of the active area. Every row except the last comes from Silvaco's example.

| Parameter | Value |
|---|---|
| Substrate | Si ⟨100⟩, x = −1.5 to 0.7 µm |
| Mesh | 0.02 µm laterally from x = −0.4 to 0 µm (mask edge), 0.1–0.2 µm elsewhere |
| Stack | 20 nm pad oxide / 100 nm poly-Si / 150 nm nitride |
| Mask | Nitride etched left of x = −0.4 µm |
| Field oxidation | Wet O₂, 1000 °C, 120 min (`method fermi compress`) |
| **Added measurement (mine)** | Lateral SiO₂ extent at y = 0.021 µm (`extract ... thickness material="SiO~2" y.val=0.021`) |

## Results

**Before oxidation.** The nitride defines the active region from x = −0.4 to 0.7 µm, or 1.1 µm for the half-cell. The drawn active length is therefore **2 × 1.1 = 2.2 µm**.

![Pre-oxidation stack](plots/pre_oxidation_stack.png)

**After oxidation.** The field oxide grows under the mask edge and lifts the nitride. The poly-Si layer is partly oxidized at its edge.

![Final PBL cross-section](plots/final_pbl_cross_section.png)

**Usable active length.** If the pad oxide can grow by no more than 5%, the active region ends where the oxide is thicker than 0.02 × 1.05 = 0.021 µm. Extracting the SiO₂ extent at y = 0.021 µm gives 1.27598 µm, measured from the left edge of the 2.2 µm wide simulation.

```
Usable length = (total width − oxide extent) × 2
              = ((1.5 + 0.7) − 1.276) × 2
              ≈ 1.85 µm
```

| | Length |
|---|---|
| Drawn active region (nitride) | 2.2 µm |
| Usable after wet oxidation (≤ 5% pad-oxide growth) | 1.85 µm |

**Role of the poly-Si layer.** The poly-Si layer releases stress in the stack. Oxidizing the silicon makes the nitride layer bend, and the poly interlayer keeps it from breaking under that stress.

## Files

| File | Purpose |
|---|---|
| [`deck/anoxex05.in`](deck/anoxex05.in) | Silvaco's `anoxex05` example deck; the commented `extract` line is the only change |
| `plots/` | TonyPlot cross-sections before and after field oxidation |
