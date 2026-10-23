# Wafer chuck CAM

G-code toolpaths for machining the spin coater's wafer chuck, in metric units. Run them in numbered order:

| File | Operation |
|---|---|
| `01-pre-drill.nc` | Spot / pre-drill |
| `02-drill-3mm.nc` | 3 mm through-holes |
| `03-pocket-0.25in-flat.nc` | Pocket roughing, 1/4" flat end mill |
| `04-pocket-0.125in-flat.nc` | Pocket finishing, 1/8" flat end mill |
| `05-slot-0.25in-flat.nc` | Slot, 1/4" flat end mill |

<!-- TODO: add the CAD model (STEP) and a photo of the finished chuck -->
