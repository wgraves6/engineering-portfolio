#!/usr/bin/env python3
"""
Percent error table for lab data workbooks.

    python percent_error_table.py [workbook.xlsx]

Reads every data tab of the workbook (default: WORKBOOK next to this script),
expecting columns Section, Measurement, Type, Value and optionally Value Im.
Compares each pair of values
logged for the same measurement, and writes an "Error Table" tab back into the
workbook. Close the workbook in Excel first.

    % error = |(Type 1 - Type 2) / Type 1| * 100

Type 1 is whichever of the pair comes first in REF_ORDER, so a calculated value
outranks a simulated one and a simulated one outranks a measurement. If a row
has a Value Im entry the pair is compared as complex numbers.

An analysis notebook can import read/compare/write from here, so the notebook
and the command line produce the same numbers.

get()/put() are the read/write pair the notebook uses to pull logged readings
(LTspice, Oscilloscope, Multimeter, ...) out of a section tab and push
computed values back into it — the same `data` dict read() returns, kept in
sync in memory so nothing has to round-trip through disk mid-run.
"""

import os
import sys
from itertools import combinations
from math import hypot

from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

WORKBOOK = "lab_data.xlsx"
REF_ORDER = ["Calculation", "LTspice", "Multimeter", "Oscilloscope"]
SKIP_TABS = {"README", "Components", "Parameters", "Error Table"}
HEADERS = ["Section", "Measurement", "Type 1", "Type 2",
           "Value 1", "Value 2", "Unit", "% Error"]
WIDTHS = [26, 20, 14, 14, 14, 14, 8, 11]


def path(workbook=None):
    if workbook:
        return os.path.abspath(workbook)
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), WORKBOOK)


def number(value):
    """Float, or None for blanks and text."""
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).strip())
    except (ValueError, AttributeError):
        return None


def find_header(ws):
    """Row number and {column name: index} for the first row naming the data."""
    for row in ws.iter_rows(min_row=1, max_row=12):
        names = {str(c.value).strip(): c.column for c in row if c.value}
        if "Measurement" in names and "Type" in names:
            return row[0].row, names
    return None, None


def read(wb):
    """{(section, measurement): {type: (re, im, unit)}}, in sheet order."""
    data = {}
    for name in wb.sheetnames:
        if name in SKIP_TABS:
            continue
        ws = wb[name]
        head, cols = find_header(ws)
        if not cols:
            continue
        default_section = ws["A1"].value or name
        for r in range(head + 1, ws.max_row + 1):
            def get(col):
                return ws.cell(row=r, column=cols[col]).value if col in cols else None

            meas, typ = get("Measurement"), get("Type")
            value = number(get("Value"))
            if not meas or not typ or value is None:
                continue
            section = get("Section") or default_section
            group = data.setdefault((str(section).strip(), str(meas).strip()), {})
            group.setdefault(str(typ).strip(),
                             (value, number(get("Value Im")), get("Unit") or ""))
    return data


def entry(data, section, measurement, typ):
    """(re, im, unit) tuple for one logged reading, or None if it isn't there."""
    return data.get((section, measurement), {}).get(typ)


def get(data, section, measurement, typ, default=None):
    """Numeric value for one logged reading, complex if it has an imaginary part.

    Mirrors the component dict's ergonomics (`C["RS_inv"]`): a plain number
    back, no tuple to unpack. Returns `default` if that (section,
    measurement, type) hasn't been logged yet.
    """
    e = entry(data, section, measurement, typ)
    if e is None:
        return default
    re, im, _ = e
    return complex(re, im) if im else re


def find_sheet(wb, section):
    """The section tab whose title (A1, falling back to the tab name) matches."""
    for name in wb.sheetnames:
        if name in SKIP_TABS:
            continue
        ws = wb[name]
        if (ws["A1"].value or name) == section:
            return ws
    raise KeyError(f"no section tab for {section!r}")


def put(wb, data, section, measurement, typ, value, unit=None, notes=None):
    """Write one (Measurement, Type) reading into its section tab.

    Updates the row if (measurement, typ) is already logged there, appends
    one if not. Also updates `data` in place so a later get()/logged() call
    sees the write without re-reading the workbook. Nothing touches disk —
    call wb.save(...) once, when the run is done.
    """
    ws = find_sheet(wb, section)
    head, cols = find_header(ws)
    v = complex(value)
    re_part, im_part = v.real, (v.imag or None)

    row = None
    for r in range(head + 1, ws.max_row + 1):
        if (ws.cell(row=r, column=cols["Measurement"]).value == measurement
                and ws.cell(row=r, column=cols["Type"]).value == typ):
            row = r
            break
    if row is None:
        row = ws.max_row + 1
        ws.cell(row=row, column=cols["Measurement"], value=measurement)
        ws.cell(row=row, column=cols["Type"], value=typ)

    ws.cell(row=row, column=cols["Value"], value=re_part)
    if "Value Im" in cols:
        ws.cell(row=row, column=cols["Value Im"], value=im_part)
    if unit is not None and "Unit" in cols:
        ws.cell(row=row, column=cols["Unit"], value=unit)
    if notes is not None and "Notes" in cols:
        ws.cell(row=row, column=cols["Notes"], value=notes)
    stored_unit = ws.cell(row=row, column=cols["Unit"]).value if "Unit" in cols else unit

    data.setdefault((section, measurement), {})[typ] = (re_part, im_part, stored_unit or "")
    return value


def error(v1, v2):
    """Percent difference between two (re, im) pairs, compared by magnitude.

    Sign and phase convention routinely differ between a hand calculation
    and an instrument reading (a p-p or rms reading has no sign at all), so
    this compares |v1| against |v2| rather than a signed/vector difference.
    None if the reference is 0.
    """
    re1, im1 = v1
    re2, im2 = v2
    m1 = hypot(re1, im1 or 0.0)
    m2 = hypot(re2, im2 or 0.0)
    return None if m1 == 0 else abs(m2 - m1) / m1 * 100


def show(re_part, im_part):
    if im_part is None:
        return round(re_part, 6)
    return f"{re_part:g}{'+' if im_part >= 0 else '-'}j{abs(im_part):g}"


def compare(data):
    """One row per pair, plus the measurements still waiting on a second value."""
    rows, pending = [], []
    for (section, meas), values in data.items():
        types = [t for t in REF_ORDER if t in values]
        types += [t for t in values if t not in types]
        if len(types) < 2:
            pending.append(f"{section} / {meas}")
            continue
        for t1, t2 in combinations(types, 2):
            re1, im1, unit = values[t1]
            re2, im2, _ = values[t2]
            pct = error((re1, im1), (re2, im2))
            rows.append([section, meas, t1, t2, show(re1, im1), show(re2, im2),
                         unit, None if pct is None else round(pct, 2)])
    return rows, pending


def write(wb, rows):
    if "Error Table" in wb.sheetnames:
        del wb["Error Table"]
    ws = wb.create_sheet("Error Table")

    norm = Font(name="Arial", size=10)
    bold = Font(name="Arial", size=10, bold=True)
    fill = PatternFill("solid", fgColor="D9D9D9")
    edge = Side(style="thin", color="999999")
    box = Border(left=edge, right=edge, top=edge, bottom=edge)
    middle = Alignment(horizontal="center")

    ws["A1"] = "Percent error"
    ws["A1"].font = Font(name="Arial", size=12, bold=True)
    ws["A2"] = "Generated automatically. Rerunning overwrites this tab."
    ws["A2"].font = Font(name="Arial", size=9, italic=True, color="555555")

    for col, (head, width) in enumerate(zip(HEADERS, WIDTHS), start=1):
        cell = ws.cell(row=4, column=col, value=head)
        cell.font, cell.fill, cell.border, cell.alignment = bold, fill, box, middle
        ws.column_dimensions[cell.column_letter].width = width

    for r, row in enumerate(rows, start=5):
        for col, value in enumerate(row, start=1):
            cell = ws.cell(row=r, column=col, value=value)
            cell.font, cell.border = norm, box
            if col >= 3:
                cell.alignment = middle
        ws.cell(row=r, column=8).number_format = "0.00"

    ws.freeze_panes = "A5"


def print_table(headers, rows):
    """Plain-text table, column widths sized to the data."""
    if not rows:
        print("(nothing to show)")
        return
    widths = [max(len(h), *(len(str(row[i])) for row in rows))
              for i, h in enumerate(headers)]
    print("  ".join(h.ljust(w) for h, w in zip(headers, widths)))
    for row in rows:
        print("  ".join(str(v).ljust(w) for v, w in zip(row, widths)))


def main():
    book = path(sys.argv[1] if len(sys.argv) > 1 else None)
    wb = load_workbook(book, data_only=True)
    rows, pending = compare(read(wb))

    if not rows:
        print("Nothing to compare yet. Log two values for the same measurement "
              "and run again.")
        return

    print_table(HEADERS, rows)

    write(wb, rows)
    wb.save(book)
    print(f"\n{len(rows)} comparisons written to the Error Table tab of {os.path.basename(book)}")

    if pending:
        print(f"\nStill needs a second value ({len(pending)}):")
        for item in pending:
            print(f"  {item}")


if __name__ == "__main__":
    main()
