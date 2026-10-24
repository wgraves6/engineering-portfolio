#!/usr/bin/env python3
"""
Deal-Grove fit of wet thermal oxide thickness vs. furnace time.

    python deal_grove_fit.py

Reads data/oxide_thickness_vs_time.csv (9 thickness readings per wafer, in
angstroms), averages each wafer, and fits the linearized Deal-Grove model

    t / x = (1/B) * x + A/B

with t in hours and x in um. B = 1/slope, A = intercept * B. The initial-oxide
offset tau comes from an assumed native oxide X0:

    tau = (X0^2 + A * X0) / B

Prints the fit and a predicted-vs-measured table, and writes the plots to
plots/.
"""

import csv
import os
from math import sqrt

import matplotlib.pyplot as plt
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data", "oxide_thickness_vs_time.csv")
PLOTS = os.path.join(HERE, "..", "plots")

X0_UM = 20e-4  # assumed native oxide: 20 A = 0.002 um

# Chart colors: categorical slots 1-2, text and grid inks
MEASURED = "#2a78d6"
MODEL = "#eb6834"
INK = "#0b0b0b"
INK_2 = "#52514e"
GRID = "#e4e3df"


def read(path):
    """Return furnace time (min), mean thickness (um) and std dev (um) per wafer."""
    t_min, mean_um, std_um = [], [], []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            pts = np.array([float(row[f"pt{i}_A"]) for i in range(1, 10)]) * 1e-4
            t_min.append(float(row["furnace_time_min"]))
            mean_um.append(pts.mean())
            std_um.append(pts.std(ddof=1))
    return np.array(t_min), np.array(mean_um), np.array(std_um)


def fit(t_hr, x_um):
    """Fit t/x vs x. Return A (um), B (um^2/hr), slope, intercept."""
    slope, intercept = np.polyfit(x_um, t_hr / x_um, 1)
    B = 1 / slope
    A = intercept * B
    return A, B, slope, intercept


def predict(t_hr, A, B, tau):
    """Oxide thickness (um) after t_hr hours."""
    return (-A + np.sqrt(A**2 + 4 * B * (t_hr + tau))) / 2


def style(ax, title, xlabel, ylabel):
    ax.set_title(title, loc="left", color=INK, fontsize=12, fontweight="bold")
    ax.set_xlabel(xlabel, color=INK_2)
    ax.set_ylabel(ylabel, color=INK_2)
    ax.grid(True, color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color(INK_2)
    ax.tick_params(colors=INK_2)


def plot_linear_fit(x_um, t_hr, slope, intercept, A, B):
    fig, ax = plt.subplots(figsize=(6.4, 4.4), dpi=150)
    xs = np.linspace(0, x_um.max() * 1.05, 100)
    ax.plot(xs, slope * xs + intercept, color=MODEL, linewidth=2,
            label=f"fit: t/x = {slope:.3f}·x + {intercept:.3f}")
    ax.plot(x_um, t_hr / x_um, "o", color=MEASURED, markersize=8,
            markeredgecolor="white", markeredgewidth=2, label="wafer mean")
    ax.annotate(f"B = 1/slope = {B:.3f} µm²/hr\nA = intercept·B = {A:.3f} µm",
                xy=(0.04, 0.93), xycoords="axes fraction", va="top", color=INK)
    style(ax, "Linearized Deal–Grove fit", "Oxide thickness x (µm)",
          "t / x (hr/µm)")
    ax.set_xlim(0, None)
    ax.set_ylim(0, None)
    ax.legend(loc="lower right", frameon=False, labelcolor=INK)
    fig.tight_layout()
    fig.savefig(os.path.join(PLOTS, "deal_grove_linear_fit.png"))
    plt.close(fig)


def plot_thickness(t_min, x_um, std_um, A, B, tau):
    fig, ax = plt.subplots(figsize=(6.4, 4.4), dpi=150)
    ts = np.linspace(0, t_min.max() * 1.03, 300)
    ax.plot(ts, predict(ts / 60, A, B, tau), color=MODEL, linewidth=2,
            label="Deal–Grove model")
    ax.errorbar(t_min, x_um, yerr=std_um, fmt="o", color=MEASURED, markersize=8,
                markeredgecolor="white", markeredgewidth=2, capsize=4,
                elinewidth=1.5, label="wafer mean ± 1σ (9 points)")
    style(ax, "Wet oxide thickness vs. furnace time", "Furnace time (min)",
          "Oxide thickness (µm)")
    ax.set_xlim(0, None)
    ax.set_ylim(0, None)
    ax.legend(loc="lower right", frameon=False, labelcolor=INK)
    fig.tight_layout()
    fig.savefig(os.path.join(PLOTS, "thickness_vs_time.png"))
    plt.close(fig)


def plot_uniformity(t_min, std_um):
    fig, ax = plt.subplots(figsize=(6.4, 3.6), dpi=150)
    labels = [f"{t:.0f}" for t in t_min]
    std_A = std_um * 1e4
    bars = ax.bar(labels, std_A, color=MEASURED, width=0.6)
    ax.bar_label(bars, labels=[f"{s:.0f} Å" for s in std_A], padding=3,
                 color=INK, fontsize=9)
    style(ax, "Within-wafer thickness spread", "Furnace time (min)",
          "Std. dev. across 9 points (Å)")
    ax.grid(False, axis="x")
    fig.tight_layout()
    fig.savefig(os.path.join(PLOTS, "uniformity_vs_time.png"))
    plt.close(fig)


def main():
    t_min, x_um, std_um = read(DATA)
    t_hr = t_min / 60
    A, B, slope, intercept = fit(t_hr, x_um)
    tau = (X0_UM**2 + A * X0_UM) / B

    print(f"slope = {slope:.4f} hr/um^2, intercept = {intercept:.4f} hr/um")
    print(f"B = {B:.4f} um^2/hr, A = {A:.4f} um, B/A = {B / A:.3f} um/hr")
    print(f"tau = {tau:.3e} hr ({tau * 3600:.2f} s) for X0 = {X0_UM * 1e4:.0f} A")
    print()
    print(f"{'time (min)':>10} {'measured (um)':>14} {'std dev (A)':>12} "
          f"{'model (um)':>11} {'error':>8}")
    for t, x, sd in zip(t_min, x_um, std_um):
        model = predict(t / 60, A, B, tau)
        err = (x - model) / model * 100
        print(f"{t:10.0f} {x:14.4f} {sd * 1e4:12.1f} {model:11.4f} {err:+7.2f}%")

    os.makedirs(PLOTS, exist_ok=True)
    plot_linear_fit(x_um, t_hr, slope, intercept, A, B)
    plot_thickness(t_min, x_um, std_um, A, B, tau)
    plot_uniformity(t_min, std_um)


if __name__ == "__main__":
    main()
