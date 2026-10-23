# Engineering Tools

Small utilities I wrote for circuit analysis and lab data reduction, and reused across courses.

## Python

| Script | What it does |
|---|---|
| [`impedance.py`](python/impedance.py) | Phasor and AC impedance helpers: `Zcap`, `Zind`, series and parallel combination, rectangular ↔ polar conversion, and phasor multiply/divide, with consistent half-up rounding. |
| [`bode_plotter.py`](python/bode_plotter.py) | Plots magnitude (dB) and phase for any transfer function `H(jω)` given as a Python function. |
| [`percent_error_table.py`](python/percent_error_table.py) | Reads an Excel lab workbook and pairs every value logged for the same measurement (calculation vs. LTspice vs. multimeter vs. oscilloscope). It computes percent error, as a complex magnitude when imaginary parts exist, and writes a formatted "Error Table" sheet back into the workbook. |

```python
import impedance as z
z.set_frequency(1e3)                       # 1 kHz
Zin = z.Zser(100, z.Zcap(1e-6))            # 100 Ω + 1 µF  -> (100-159.155j)
z.rect_to_phasor(Zin)                      # -> (187.964, -57.858)
```

```python
import numpy as np
from bode_plotter import bode_plot
R, C = 1e3, 100e-9
bode_plot(lambda w: 1 / (1 + 1j * w * R * C), title="RC low-pass")
```

```bash
pip install -r requirements.txt
python python/percent_error_table.py my_lab_data.xlsx
```

## JMP (JSL)

| Script | What it does |
|---|---|
| [`percent_error_table.jsl`](jmp/percent_error_table.jsl) | The same percent-error comparison as the Python version, run directly on a JMP data table. Supports configurable reference priority and either all-pairs or reference-only comparison. |
| [`ellipsometry_contour_plot.jsl`](jmp/ellipsometry_contour_plot.jsl) | Wafer-map contour plot of film thickness from ellipsometer X/Y measurements, used to visualize oxide uniformity. |
