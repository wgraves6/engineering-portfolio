// Simple defect counter
// For each timepoint image: evens out the brightness, then counts dark spots.

// ===== SETTINGS (tweak these) =====
DARKER   = 0.20;   // how much darker than its surroundings a spot must be (0.08 = 8% darker)
MIN_SIZE = 6;      // smallest spot counted, in pixels
SMOOTH   = 50;     // blur size (px) used to find the "normal" brightness; keep bigger than your biggest defect
ROI_X = 990;  ROI_Y = 540;  ROI_R = 640;   // center and radius of the circle to analyze (px)
// ==================================

dir = getArgument();                                   // lets it run from the command line too
if (dir == "") dir = getDirectory("Choose a run folder");
out = dir + "simple_analysis" + File.separator;
File.makeDirectory(out);

setBatchMode(true);
setOption("BlackBackground", true);
run("Set Measurements...", "area redirect=None decimal=5");
roiManager("reset");
Table.create("Defects");
row = 0;

files = getFileList(dir);
Array.sort(files);

for (i = 0; i < files.length; i++) {
    name = files[i];
    if (!endsWith(name, ".png") || indexOf(name, "_t") < 0) continue;   // only timepoint images

    // 1. open and keep only the green channel (red is maxed out by the bulb)
    open(dir + name);
    run("Split Channels");
    close(name + " (red)");
    close(name + " (blue)");
    selectImage(name + " (green)");
    run("32-bit");
    run("Gaussian Blur...", "sigma=1.5");               // light blur to smooth out camera noise
    rename("img");

    // 2. even out brightness: divide each pixel by a heavily blurred copy
    //    result is ~1.0 everywhere; defects come out below 1.0
    run("Duplicate...", "title=bg");
    run("Gaussian Blur...", "sigma=" + SMOOTH);
    imageCalculator("Divide create 32-bit", "img", "bg");
    rename("normalized");

    // 3. mark everything more than DARKER below its surroundings
    setThreshold(-1000, 1 - DARKER);
    run("Convert to Mask");

    // 4. count spots inside the circle
    makeOval(ROI_X - ROI_R, ROI_Y - ROI_R, 2 * ROI_R, 2 * ROI_R);
    run("Analyze Particles...", "size=" + MIN_SIZE + "-Infinity pixel add");
    roiArea = getValue("Area");
    count = roiManager("count");
    total = 0;
    for (r = 0; r < count; r++) {
        roiManager("select", r);
        total = total + getValue("Area");
    }

    // 5. add a row to the results table
    Table.set("File", row, name, "Defects");
    Table.set("Defect count", row, count, "Defects");
    Table.set("Defect area (px^2)", row, total, "Defects");
    Table.set("Area fraction", row, total / roiArea, "Defects");
    row++;

    // 6. save a check image: original with the counted spots outlined
    open(dir + name);
    roiManager("Show All without labels");
    run("Flatten");
    saveAs("Jpeg", out + replace(name, ".png", "_check.jpg"));

    roiManager("reset");
    run("Close All");
}

// save the table: one row per image
Table.save(out + "summary.csv", "Defects");
setBatchMode(false);
print("Done. Results in " + out);