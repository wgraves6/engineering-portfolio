# -*- coding: utf-8 -*-
import math
from decimal import Decimal, ROUND_HALF_UP

printVals = False
f = 0  # global frequency

def set_frequency(freq):
    """Set the global frequency in Hz for impedance calculations."""
    global f
    f = float(freq)
    if printVals:
        print(f"Frequency set to: {f} Hz")

def round_complex(value, decimals=3):
    rounding_format = '0.' + '0' * decimals
    def round_part(x):
        return float(Decimal(str(x)).quantize(
            Decimal(rounding_format), rounding=ROUND_HALF_UP))

    if isinstance(value, complex):
        return complex(round_part(value.real), round_part(value.imag))
    else:
        return round_part(value)

def Zcap(C):
    w = f * 2 * math.pi
    Z = -1j / (w * C)
    Z = round_complex(Z)
    if printVals:
        print("Zcap: ", Z)
    return Z

def Zind(L):
    w = f * 2 * math.pi
    Z = 1j * w * L
    Z = round_complex(Z)
    if printVals:
        print("Zind: ", Z)
    return Z

def Zpar(*Zs):
    inv_sum = 0
    for Z in Zs:
        if Z == 0:
            return 0  # short circuit dominates
        inv_sum += 1 / Z
    Zeq = 1 / inv_sum
    Zeq = round_complex(Zeq)
    if printVals:
        print("Zpar:", Zeq)
    return Zeq

def Zser(*Zs):
    Zeq = sum(Zs)
    Zeq = round_complex(Zeq)
    if printVals:
        print("Zseries:", Zeq)
    return Zeq

def phasor_to_rect(magnitude, phase_deg):
    phase_rad = math.radians(phase_deg)
    real = magnitude * math.cos(phase_rad)
    imag = magnitude * math.sin(phase_rad)
    rect = round_complex(complex(real, imag))
    if printVals:
        print("Rect:", rect)
    return rect

def rect_to_phasor(z, decimals=3):
    rounding_format = '0.' + '0' * decimals

    def round_part(x):
        return float(Decimal(str(x)).quantize(
            Decimal(rounding_format), rounding=ROUND_HALF_UP))

    magnitude = round_part(abs(z))
    phase_rad = math.atan2(z.imag, z.real)
    phase_deg = round_part(math.degrees(phase_rad))

    if printVals:
        print("Phasor:", (magnitude, phase_deg))

    return magnitude, phase_deg

def multiply_phasors(p1, p2):
    m1, a1 = p1
    m2, a2 = p2

    magnitude = round_complex(m1 * m2)
    angle = round_complex(a1 + a2)

    if printVals:
        print("Product (phasor):", (magnitude, angle))

    return magnitude, angle

def divide_phasors(p1, p2):
    m1, a1 = p1
    m2, a2 = p2

    if m2 == 0:
        raise ZeroDivisionError("Cannot divide by zero-magnitude phasor")

    magnitude = round_complex(m1 / m2)
    angle = round_complex(a1 - a2)

    if printVals:
        print("Quotient (phasor):", (magnitude, angle))

    return magnitude, angle