import os
import csv
import sys

# Fixes a run that was captured under the wrong shard ID.
# Usage: python capture_rename.py <run folder> <old shard ID> <new shard ID> [--dry-run]
#   e.g. python capture_rename.py captures/run02_3 3 1

if len(sys.argv) < 4:
    sys.exit("Usage: python capture_rename.py <run folder> <old shard ID> <new shard ID> [--dry-run]")
RUN_FOLDER, OLD_ID, NEW_ID = sys.argv[1:4]
DRY_RUN = "--dry-run" in sys.argv[4:]                 # True = just show what would change

parent, old_tag = os.path.split(RUN_FOLDER.rstrip("\\/"))
if not old_tag.endswith("_" + OLD_ID):
    sys.exit(f"Folder name {old_tag} doesn't end in _{OLD_ID}. Check OLD_ID.")
new_tag = old_tag[: -len(OLD_ID)] + NEW_ID
new_folder = os.path.join(parent, new_tag)
if os.path.exists(new_folder):
    sys.exit(f"{new_folder} already exists. Not overwriting.")

# 1. fix the log contents (Shard ID and File columns)
old_log = os.path.join(RUN_FOLDER, f"{old_tag}_log.csv")
if os.path.exists(old_log):
    with open(old_log, newline="") as f:
        rows = list(csv.reader(f))
    header = rows[0]
    sid, fcol = header.index("Shard ID"), header.index("File")
    for r in rows[1:]:
        if r[sid] == OLD_ID:
            r[sid] = NEW_ID
        r[fcol] = r[fcol].replace(old_tag, new_tag, 1)
    print(f"log: {len(rows) - 1} rows updated")
    if not DRY_RUN:
        with open(old_log, "w", newline="") as f:
            csv.writer(f).writerows(rows)

# 2. rename files inside the folder (images, log, analysis outputs)
for root, dirs, files in os.walk(RUN_FOLDER):
    for name in files:
        if name.startswith(old_tag):
            new_name = new_tag + name[len(old_tag):]
            print(f"{name}  ->  {new_name}")
            if not DRY_RUN:
                os.rename(os.path.join(root, name), os.path.join(root, new_name))

# 3. rename the folder itself
print(f"folder: {old_tag}  ->  {new_tag}")
if not DRY_RUN:
    os.rename(RUN_FOLDER, new_folder)
    print("Done.")
else:
    print("\nDry run only. Run again without --dry-run to apply.")