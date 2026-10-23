import cv2
import os
import sys
import time
from datetime import datetime
import serial
from serial.tools import list_ports
from pygrabber.dshow_graph import FilterGraph

# ===== SETTINGS (match the capture script) =====
CAM_NAME = "LifeCam"
FOCUS = 20
EXPOSURE = -7
ROI_X, ROI_Y, ROI_R = 990, 540, 640     # analysis circle, drawn as a placement guide
SNAP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "inspection")
# ===============================================

# Opta
ports = [p.device for p in list_ports.comports() if p.vid == 0x2341]
if not ports:
    sys.exit("Opta not found. Check USB and close the Arduino Serial Monitor.")
opta = serial.Serial(ports[0], 115200, timeout=1)
time.sleep(2)

def lamp(on):
    opta.write(b"1" if on else b"0")

# Camera
devices = FilterGraph().get_input_devices()
idx = next((i for i, n in enumerate(devices) if CAM_NAME.lower() in n.lower()), None)
if idx is None:
    sys.exit(f"No camera matching '{CAM_NAME}'. Found: {devices}")
cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
cap.set(cv2.CAP_PROP_AUTOFOCUS, 0)
cap.set(cv2.CAP_PROP_FOCUS, FOCUS)
cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.25)
cap.set(cv2.CAP_PROP_EXPOSURE, EXPOSURE)
cap.set(cv2.CAP_PROP_AUTO_WB, 0)

print("L = lamp on/off   C = circle guide on/off   S = save snapshot   Q = quit")
lamp_on = True
show_circle = True
lamp(True)
last_keepalive = time.time()

try:
    while True:
        ok, frame = cap.read()
        if not ok:
            continue
        view = frame.copy()
        if show_circle:
            cv2.circle(view, (ROI_X, ROI_Y), ROI_R, (0, 255, 255), 3)
        status = "LAMP ON" if lamp_on else "LAMP OFF"
        cv2.putText(view, status, (30, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 255), 3)
        cv2.imshow("inspection", cv2.resize(view, (960, 540)))

        # re-send "on" every 10 s so the Opta's 30 s safety cutoff doesn't fire
        if lamp_on and time.time() - last_keepalive > 10:
            lamp(True)
            last_keepalive = time.time()

        key = cv2.waitKey(30) & 0xFF
        if key == ord("l"):
            lamp_on = not lamp_on
            lamp(lamp_on)
            last_keepalive = time.time()
        elif key == ord("c"):
            show_circle = not show_circle
        elif key == ord("s"):
            os.makedirs(SNAP_DIR, exist_ok=True)
            path = os.path.join(SNAP_DIR, datetime.now().strftime("snap_%Y%m%d_%H%M%S.png"))
            cv2.imwrite(path, frame)          # saved without the circle or text
            print(f"Saved {path}")
        elif key in (ord("q"), 27):
            break
finally:
    lamp(False)
    opta.close()
    cap.release()
    cv2.destroyAllWindows()
    print("Lamp off.")