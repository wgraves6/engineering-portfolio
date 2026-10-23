import numpy as np
import matplotlib.pyplot as plt

def bode_plot(H_func, f_min=10, f_max=1e5, points=500, title="Bode Plot", mag_ylim=None):
    """
    Generate a Bode plot for a given transfer function H(jω).

    Parameters:
    -----------
    H_func : function
        Function that takes angular frequency omega and returns complex gain H(jω)
    f_min : float
        Minimum frequency (Hz)
    f_max : float
        Maximum frequency (Hz)
    points : int
        Number of frequency points
    title : str
        Plot title
    """
    f = np.logspace(np.log10(f_min), np.log10(f_max), points)
    omega = 2 * np.pi * f

    # Compute transfer function
    H = H_func(omega)

    # Magnitude (dB) and phase (degrees)
    magnitude = 20 * np.log10(np.abs(H))
    phase = np.angle(H, deg=True)

    # Plot
    plt.figure(figsize=(10, 6))

    # Magnitude
    plt.subplot(2, 1, 1)
    plt.semilogx(f, magnitude, color='blue')
    plt.title(title)
    plt.ylabel('Magnitude (dB)')
    plt.grid(True, which='both', linestyle='--', linewidth=0.5)
    if mag_ylim is not None:
        plt.ylim(mag_ylim)

    # Phase
    plt.subplot(2, 1, 2)
    plt.semilogx(f, phase, color='red')
    plt.xlabel('Frequency (Hz)')
    plt.ylabel('Phase (degrees)')
    plt.grid(True, which='both', linestyle='--', linewidth=0.5)

    plt.tight_layout()
    plt.show()