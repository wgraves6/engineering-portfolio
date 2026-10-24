import time
import sys
import serial
from serial.tools import list_ports

BAUD = 115200
PULSE_S = 1.5          # same on-time as an imaging shot

ports = [p.device for p in list_ports.comports() if p.vid == 0x2341]
if not ports:
    sys.exit("No Arduino found.")
PORT = ports[0]
print(f"Using {PORT}")

opta = serial.Serial(PORT, BAUD, timeout=1)
time.sleep(2)
opta.reset_input_buffer()

def send(cmd):
    opta.write(cmd.encode())
    time.sleep(0.1)
    while opta.in_waiting:
        print("  <-", opta.readline().decode(errors="ignore").strip())

def pulse(seconds):
    t = time.perf_counter()
    send("1")
    time.sleep(seconds)
    send("0")
    print(f"  pulse length ~{time.perf_counter() - t:.2f} s")

try:
    print("\nStatus:")
    send("?")

    print("\nClick test (listen for the relay):")
    for _ in range(3):
        send("1"); time.sleep(1)
        send("0"); time.sleep(1)

    print(f"\nImaging-style pulses ({PULSE_S} s):")
    for _ in range(3):
        pulse(PULSE_S)
        time.sleep(2)

    print("\nInteractive: 1 = on, 0 = off, p = pulse, ? = status, q = quit")
    while True:
        cmd = input("> ").strip()
        if cmd == "q":
            break
        elif cmd == "p":
            pulse(PULSE_S)
        elif cmd in ("1", "0", "?"):
            send(cmd)

finally:
    send("0")
    opta.close()
    print("Relay off, port closed.")