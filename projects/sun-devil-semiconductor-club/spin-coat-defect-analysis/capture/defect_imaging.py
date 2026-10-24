import cv2
import time
import os
import re
import sys
import csv
from datetime import datetime
import serial
from serial.tools import list_ports
from pygrabber.dshow_graph import FilterGraph

# ================= SETTINGS =================
CAM_NAME = "USB Video Device"
FOCUS = 20                 # from focus-finder (0-40, steps of 5)
EXPOSURE = -7              # from focus-finder (lower = darker)
UNCOMPRESSED = True        # ask camera for raw YUY2 instead of MJPG (less compression noise)

LAMP_WARMUP_S = 2.0        # bulb to full, steady brightness before the first photo
N_PHOTOS = 3               # photos saved at each timepoint
PHOTO_GAP_S = 1.0          # seconds between those photos
SETTLE_FRAMES = 5          # frames thrown away before each photo (clears stale frames)

TIMEPOINTS_MIN = [0.5, 1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]   # minutes after t = 0 (spin stop)

SAVE_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "captures")
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
    while opta.in_waiting:
        line = opta.readline().decode(errors="ignore").strip()
        if "TIMEOUT" in line:
            print("  !! Opta safety timeout fired")

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
    if UNCOMPRESSED:
        c.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"YUY2"))
    c.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    c.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    c.set(cv2.CAP_PROP_AUTOFOCUS, 0)
    c.set(cv2.CAP_PROP_FOCUS, FOCUS)
    c.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.25)
    c.set(cv2.CAP_PROP_EXPOSURE, EXPOSURE)
    c.set(cv2.CAP_PROP_AUTO_WB, 0)
    fourcc = int(c.get(cv2.CAP_PROP_FOURCC)).to_bytes(4, "little").decode(errors="ignore")
    print(f"Camera {idx}: {devices[idx]}  "
          f"{int(c.get(cv2.CAP_PROP_FRAME_WIDTH))}x{int(c.get(cv2.CAP_PROP_FRAME_HEIGHT))}  "
          f"format={fourcc}  focus={c.get(cv2.CAP_PROP_FOCUS)}  "
          f"exposure={c.get(cv2.CAP_PROP_EXPOSURE)}  gain={c.get(cv2.CAP_PROP_GAIN)}")
    return c

def shoot():
    """Lamp on, warm up, take N_PHOTOS photos PHOTO_GAP_S apart, lamp off.
    Returns (list of photos, None where a grab failed; lamp-on seconds)."""
    t_on = time.perf_counter()
    lamp(True)
    t_end = time.time() + LAMP_WARMUP_S
    while time.time() < t_end:             # keep reading so stale frames are flushed
        cap.read()
    photos = []
    for n in range(N_PHOTOS):
        if n > 0:
            t_end = time.time() + PHOTO_GAP_S
            while time.time() < t_end:
                cap.read()
        for _ in range(SETTLE_FRAMES):
            cap.read()
        ok, f = cap.read()
        photos.append(f if ok else None)
    lamp(False)
    return photos, time.perf_counter() - t_on

def idle_until(t_target):
    while time.time() < t_target:
        cap.read()                         # keep stream fresh
        time.sleep(0.05)
        opta_messages()

def preview():
    """Live view with lamp on for positioning. Keeps lamp alive past the 30 s cutoff."""
    print("Preview: lamp on. Press q in the window to finish.")
    lamp(True)
    last_keepalive = time.time()
    while True:
        ok, frame = cap.read()
        if ok:
            cv2.imshow("preview (q to close)", cv2.resize(frame, (960, 540)))
        if time.time() - last_keepalive > 10:
            lamp(True)                     # resets the Opta's safety timer
            last_keepalive = time.time()
        if cv2.waitKey(30) & 0xFF == ord("q"):
            break
    lamp(False)
    cv2.destroyAllWindows()


def clean(s):
    return re.sub(r"[^A-Za-z0-9-]", "", s.replace(" ", "-"))


# ---------- main ----------
opta = open_opta()
cap = open_camera()
lamp(False)

run_id = input("\nRun number: ").strip()
shard_id = input("Shard ID: ").strip()

run_label = f"run{int(run_id):02d}" if run_id.isdigit() else f"run{clean(run_id)}"
tag = f"{run_label}_{clean(shard_id)}"
out_dir = os.path.join(SAVE_ROOT, tag)
if os.path.exists(out_dir) and os.listdir(out_dir):
    if input(f"{out_dir} already has files. Overwrite? (y/n): ").strip().lower() != "y":
        sys.exit("Stopped. Use a different run number or shard ID.")
os.makedirs(out_dir, exist_ok=True)

log_path = os.path.join(out_dir, f"{tag}_log.csv")
log_file = open(log_path, "w", newline="")
log = csv.writer(log_file)
log.writerow(["Run", "Shard ID", "Image", "Photo", "Time (s)", "Time (min)",
              "Lamp on (s)", "Timestamp", "File", "Status"])

def save(photos, kind, t_s, lamp_s):
    label = kind if t_s is None else f"t{int(round(t_s)):05d}s"
    for n, img in enumerate(photos, start=1):
        fname = f"{tag}_{label}_{n}.png"
        status = "ok" if img is not None else "FAILED"
        if img is not None:
            cv2.imwrite(os.path.join(out_dir, fname), img)
        log.writerow([run_id, shard_id, kind, n,
                      "" if t_s is None else round(t_s, 1),
                      "" if t_s is None else round(t_s / 60, 3),
                      round(lamp_s, 2), datetime.now().isoformat(timespec="seconds"),
                      fname, status])
    log_file.flush()
    n_ok = sum(p is not None for p in photos)
    print(f"  {tag}_{label}: {n_ok}/{len(photos)} photos saved  (lamp {lamp_s:.1f} s)")

try:
    # Optional positioning preview (do this on the bare shard, BEFORE coating)
    if input("Preview to position shard? (y/n): ").strip().lower() == "y":
        preview()

    # Bare-shard reference image
    if input("Capture bare-shard reference? (y/n): ").strip().lower() == "y":
        photos, lamp_s = shoot()
        save(photos, "bare", None, lamp_s)

    input("\nCoat the shard. Press Enter the moment the spin stops (t = 0)...")
    t0 = time.time()
    print(f"t0 = {datetime.now().strftime('%H:%M:%S')}")

    # First image: as soon as the shard is on the stage
    input("Put the shard on the stage, then press Enter for the first image...")
    t_first = time.time() - t0 + LAMP_WARMUP_S     # first photo is taken after the warm-up
    photos, lamp_s = shoot()
    save(photos, "first", t_first, lamp_s)

    # Then an image at each time in TIMEPOINTS_MIN, counted from t = 0
    for tp in TIMEPOINTS_MIN:
        # start early so the first photo lands on the target time
        start = t0 + tp * 60 - LAMP_WARMUP_S
        if time.time() > start:            # already passed (e.g. slow placement); skip it
            print(f"  skipped {tp} min (already passed)")
            continue
        print(f"Next image at {tp} min")
        idle_until(start)
        photos, lamp_s = shoot()
        save(photos, "timepoint", tp * 60, lamp_s)

    print("\nDone.")

except KeyboardInterrupt:
    print("\nStopped early.")

finally:
    try:
        lamp(False)
    except Exception:
        pass
    opta.close()
    cap.release()
    log_file.close()
    cv2.destroyAllWindows()
    print(f"Lamp off. Log: {log_path}")