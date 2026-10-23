import cv2
import time
import os
import sys
from datetime import datetime
import serial
from serial.tools import list_ports
from pygrabber.dshow_graph import FilterGraph

# ================= SETTINGS =================
CAM_NAME = "LifeCam"
FOCUS = 20                 # from focus-finder (0-40, steps of 5)
EXPOSURE = -7              # check histogram, keep peak < ~240

LAMP_WARMUP_S = 1.0        # bulb to full brightness before grabbing
SETTLE_FRAMES = 15         # frames discarded before each capture
KEEPALIVE_S = 10           # re-send lamp-on before the Opta's 30 s cutoff

SAVE_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "captures")
WINDOW = "preview  [L] lamp  [Space] capture  [Q] quit"
# ============================================


# ---------- Opta ----------
def open_opta():
    ports = [p.device for p in list_ports.comports() if p.vid == 0x2341]
    if not ports:
        sys.exit("Opta not found. Check USB and close the Arduino Serial Monitor.")
    s = serial.Serial(ports[0], 115200, timeout=1)
    time.sleep(2)                          # Opta resets when the port opens
    s.reset_input_buffer()
    print(f"Opta on {ports[0]}")
    return s

def opta_messages():
    """Drain Opta output. Returns True if the safety timeout turned the lamp off."""
    timed_out = False
    while opta.in_waiting:
        line = opta.readline().decode(errors="ignore").strip()
        if "TIMEOUT" in line:
            print("  !! Opta safety timeout fired (lamp off)")
            timed_out = True
    return timed_out

def lamp(on):
    opta.write(b"1" if on else b"0")
    time.sleep(0.02)
    opta_messages()


# ---------- camera ----------
def open_camera():
    devices = FilterGraph().get_input_devices()
    matches = [i for i, n in enumerate(devices) if CAM_NAME.lower() in n.lower()]
    if not matches:
        sys.exit(f"No camera matching '{CAM_NAME}'. Found: {devices}")
    idx = matches[0]
    c = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
    if not c.isOpened():
        sys.exit("Camera found but failed to open. Close other camera apps.")
    c.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    c.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    c.set(cv2.CAP_PROP_AUTOFOCUS, 0)
    c.set(cv2.CAP_PROP_FOCUS, FOCUS)
    c.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.25)
    c.set(cv2.CAP_PROP_EXPOSURE, EXPOSURE)
    c.set(cv2.CAP_PROP_AUTO_WB, 0)
    print(f"Camera {idx}: {devices[idx]}  "
          f"{int(c.get(cv2.CAP_PROP_FRAME_WIDTH))}x{int(c.get(cv2.CAP_PROP_FRAME_HEIGHT))}  "
          f"focus={c.get(cv2.CAP_PROP_FOCUS)}  exposure={c.get(cv2.CAP_PROP_EXPOSURE)}")
    return c


# ---------- capture ----------
def capture(lamp_was_on):
    """Grab one full-res frame with the lamp on, then restore the lamp state."""
    if not lamp_was_on:
        lamp(True)
        t_end = time.time() + LAMP_WARMUP_S
        while time.time() < t_end:         # keep the stream fresh while the bulb warms
            cap.read()
    for _ in range(SETTLE_FRAMES):
        cap.read()
    ok, frame = cap.read()
    if not lamp_was_on:
        lamp(False)

    if not ok:
        print("  FAILED: no frame from camera")
        return None
    now = datetime.now()
    day_dir = os.path.join(SAVE_ROOT, now.strftime("%Y-%m-%d"))
    os.makedirs(day_dir, exist_ok=True)
    fname = now.strftime("%Y-%m-%d_%H-%M-%S") + f"-{now.microsecond // 1000:03d}.png"
    cv2.imwrite(os.path.join(day_dir, fname), frame)
    print(f"  saved: {fname}")
    return fname


# ---------- main ----------
opta = open_opta()
cap = open_camera()
lamp(False)

lamp_on = False
last_keepalive = 0.0
status_msg, status_until = "", 0.0

print(f"Saving to {SAVE_ROOT}")
print("Keys (in the preview window): L = toggle lamp, Space = capture, Q = quit")

try:
    while True:
        if opta_messages():
            lamp_on = False

        if lamp_on and time.time() - last_keepalive > KEEPALIVE_S:
            lamp(True)                     # resets the Opta's safety timer
            last_keepalive = time.time()

        ok, frame = cap.read()
        if ok:
            view = cv2.resize(frame, (960, 540))
            cv2.putText(view, f"LAMP {'ON' if lamp_on else 'OFF'}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                        (0, 255, 255) if lamp_on else (160, 160, 160), 2)
            cv2.putText(view, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            if time.time() < status_until:
                cv2.putText(view, status_msg, (10, 525),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.imshow(WINDOW, view)

        key = cv2.waitKey(30) & 0xFF
        if key in (ord("q"), ord("Q")):
            break
        elif key in (ord("l"), ord("L")):
            lamp_on = not lamp_on
            lamp(lamp_on)
            last_keepalive = time.time()
            print(f"Lamp {'on' if lamp_on else 'off'}")
        elif key == ord(" "):
            fname = capture(lamp_on)
            status_msg = f"Saved {fname}" if fname else "Capture FAILED"
            status_until = time.time() + 2
            if lamp_on:
                last_keepalive = 0         # force a keepalive right after the pause

except KeyboardInterrupt:
    print("\nStopped.")

finally:
    try:
        lamp(False)
    except Exception:
        pass
    opta.close()
    cap.release()
    cv2.destroyAllWindows()
    print("Lamp off.")
