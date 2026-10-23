// Defect count: counts the very dark spots inside a circle in each image.

// ===== SETTINGS =====
DARKER   = 0.30;   // a defect is at least this much darker than its surroundings (0.30 = 30% darker)
MIN_SIZE = 10;     // smallest defect counted, in pixels
SMOOTH   = 50;     // blur (px) used to find normal brightness; keep bigger than your biggest defect
ROI_X = 969;  ROI_Y = 540;  ROI_R = 640;   // circle to analyze (px); the field edge is at ~695
// ====================

dir = getArgument();
if (dir == "") dir = getDirectory("Choose a run folder");
out = dir + "defect_count" + File.separator;
File.makeDirectory(out);

setBatchMode(true);
setOption("BlackBackground", true);
run("Set Measurements...", "area redirect=None decimal=3");
roiManager("reset");
Table.create("Defects");
row = 0;
// kept for the per-timepoint averages at the end
keys = newArray(0); runs = newArray(0); shards = newArray(0);
secs = newArray(0); counts = newArray(0); areas = newArray(0);

files = getFileList(dir);
Array.sort(files);

for (i = 0; i < files.length; i++) {
    name = files[i];
    if (!matches(name, ".*_t[0-9]+s(_[0-9]+)?\\.png")) continue;      // timepoint images only (skips bare)

    // 0. read run, shard, time and photo number from the name, e.g. run03_2_t00300s_1.png
    base  = replace(name, ".png", "");
    tpos  = lastIndexOf(base, "_t");
    tag   = substring(base, 0, tpos);                 // run03_2
    rest  = substring(base, tpos + 2);                // 00300s_1  or  00300s
    spos  = indexOf(rest, "s");
    t_s   = parseInt(substring(rest, 0, spos));       // 300
    photo = 1;
    if (lengthOf(rest) > spos + 1) photo = parseInt(substring(rest, spos + 2));
    run_id   = substring(tag, 0, indexOf(tag, "_"));  // run03
    shard_id = substring(tag, indexOf(tag, "_") + 1); // 2

    // 1. green channel, light blur to remove camera noise
    open(dir + name);
    run("Split Channels");
    close(name + " (red)");
    close(name + " (blue)");
    selectImage(name + " (green)");
    run("32-bit");
    run("Gaussian Blur...", "sigma=1.5");
    rename("img");

    // 2. even out brightness: divide by a heavily blurred copy (background ~1.0)
    run("Duplicate...", "title=bg");
    run("Gaussian Blur...", "sigma=" + SMOOTH);
    imageCalculator("Divide create 32-bit", "img", "bg");

    // 3. keep only pixels at least DARKER below their surroundings
    setThreshold(-1000, 1 - DARKER);
    run("Convert to Mask");

    // 4. find defects inside the circle
    makeOval(ROI_X - ROI_R, ROI_Y - ROI_R, 2 * ROI_R, 2 * ROI_R);
    run("Analyze Particles...", "size=" + MIN_SIZE + "-Infinity pixel add");
    count = roiManager("count");
    total = 0;
    for (r = 0; r < count; r++) {
        roiManager("select", r);
        total = total + getValue("Area");
    }

    // 5. one row per image
    Table.set("File", row, name, "Defects");
    Table.set("Run", row, run_id, "Defects");
    Table.set("Shard", row, shard_id, "Defects");
    Table.set("Time (s)", row, t_s, "Defects");
    Table.set("Time (min)", row, t_s / 60, "Defects");
    Table.set("Photo", row, photo, "Defects");
    Table.set("Defect count", row, count, "Defects");
    Table.set("Total defect area (px^2)", row, total, "Defects");
    row++;
    keys   = Array.concat(keys, tag + "_" + t_s);
    runs   = Array.concat(runs, run_id);
    shards = Array.concat(shards, shard_id);
    secs   = Array.concat(secs, t_s);
    counts = Array.concat(counts, count);
    areas  = Array.concat(areas, total);

    // 6. check image: circle in yellow, defects outlined
    open(dir + name);
    setColor(255, 255, 0);
    setLineWidth(3);
    drawOval(ROI_X - ROI_R, ROI_Y - ROI_R, 2 * ROI_R, 2 * ROI_R);
    roiManager("Show All without labels");
    run("Flatten");
    saveAs("Jpeg", out + replace(name, ".png", "_check.jpg"));

    roiManager("reset");
    run("Close All");
}

Table.save(out + "defect_count.csv", "Defects");

// average the photos taken at the same timepoint (files are sorted, so they sit together)
Table.create("Averages");
arow = 0;
i = 0;
while (i < keys.length) {
    j = i; sumC = 0; sumA = 0;
    same = true;
    while (same) {
        sumC = sumC + counts[j];
        sumA = sumA + areas[j];
        j++;
        same = false;
        if (j < keys.length) same = (keys[j] == keys[i]);
    }
    n = j - i;
    Table.set("Run", arow, runs[i], "Averages");
    Table.set("Shard", arow, shards[i], "Averages");
    Table.set("Time (s)", arow, secs[i], "Averages");
    Table.set("Time (min)", arow, secs[i] / 60, "Averages");
    Table.set("Photos", arow, n, "Averages");
    Table.set("Mean defect count", arow, sumC / n, "Averages");
    Table.set("Mean defect area (px^2)", arow, sumA / n, "Averages");
    arow++;
    i = j;
}
Table.save(out + "defect_count_averaged.csv", "Averages");
setBatchMode(false);
print("Done. Results in " + out);