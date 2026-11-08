// Process view: a schematic cross-section that follows the operation in view.
// Each <article class="op"> in index.html carries its own panel text: the number (.op-no),
// the name (h3), data-note (the line under the panel) and data-stage, which picks the drawing below.
// Scroll position inside an op sets that stage's progress (0..1); the drawing for a stage assumes
// every earlier stage is finished. An op whose data-stage is empty or unknown keeps the previous
// drawing and shows the first three rows of its recipe table in the readout, so a new op can be
// added in index.html alone. Numbers in the readout come from the linked work.
// The drawing only moves while the reader scrolls, so it stays on with prefers-reduced-motion;
// the autonomous animations (photon dashes, time-lapse autoplay) are off in that case.
(function () {
  "use strict";

  var svg = document.querySelector(".xsec");
  if (!svg) return;
  var NS = "http://www.w3.org/2000/svg";
  var ops = Array.prototype.slice.call(document.querySelectorAll(".op"));
  // Drawing stages, in process order. data-stage on each op names one of these.
  var STAGES = ["clean", "oxidize", "coat", "hold", "expose", "develop", "measure", "etch", "test", "analyze"];
  var q = function (sel) { return svg.querySelector(sel); };

  /* ---------- Geometry (SVG units) ---------- */
  var X0 = 30, X1 = 530;          // coupon edges
  var Y0 = 262;                   // original Si surface
  var YB = 350;                   // bottom of the drawn substrate
  var OX0 = 245, OX1 = 315;       // mask opening (matches the chrome in index.html)
  var HOX = 30;                   // drawn oxide thickness at the end of oxidation
  var T_RESIN = 26, BEAD = 9;     // drawn resin thickness and edge bead after the spin
  var LOSS = 7;                   // drawn top-layer loss in the IPA develop
  var TRENCH = 70;                // drawn trench depth at the end of the etch

  /* ---------- Data from the write-ups ---------- */
  // Deal–Grove fit (thermal-oxidation-deal-grove): B in µm²/hr, A in µm, tau in hr
  var DG = { A: 0.272, B: 0.415, tau: 1.32e-3, tMax: 498 };
  function dealGrove(tMin) {
    var t = tMin / 60 + DG.tau;
    return (-DG.A + Math.sqrt(DG.A * DG.A + 4 * DG.B * t)) / 2;
  }
  var X_MAX = dealGrove(DG.tMax);
  // Capture times of FURI run 02 (s after the spin stops)
  var TL = document.querySelector(".timelapse");
  var TL_BASE = TL ? TL.dataset.base : "";
  var TL_TIMES = TL ? TL.dataset.times.split(",").map(Number) : [];
  // Measured CD4007 common-source transfer (device-iv-characterization): VGS 0..7 V in 0.5 V steps
  var VDS = [15, 15, 14.98, 14.66, 12.71, 8.945, 4.263, 0.845, 0.623, 0.520, 0.485, 0.414, 0.381, 0.355, 0.334];
  var QPT = { vgs: 2.52, vds: 8.5 };

  /* ---------- Helpers ---------- */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function set(n, attrs) { for (var k in attrs) n.setAttribute(k, attrs[k]); }
  function show(n, o) { n.style.opacity = o; n.style.visibility = o > 0.001 ? "visible" : "hidden"; }
  function f1(v) { return v.toFixed(1); }
  function clock(t) { return Math.floor(t / 60) + ":" + ("0" + Math.round(t % 60)).slice(-2); }

  // Build a filled path between y = base(x) and y = base(x) - thick(x), split where thickness is ~0
  function bandPath(xa, xb, base, thick) {
    var d = "", top = [], bottom = [];
    function flush() {
      if (top.length > 1) {
        d += "M" + top.map(function (p) { return f1(p[0]) + " " + f1(p[1]); }).join("L");
        d += "L" + bottom.reverse().map(function (p) { return f1(p[0]) + " " + f1(p[1]); }).join("L") + "Z";
      }
      top = []; bottom = [];
    }
    for (var x = xa; x <= xb + 0.01; x += 2.5) {
      var t = thick(x);
      if (t > 0.35) { top.push([x, base(x) - t]); bottom.push([x, base(x)]); }
      else flush();
    }
    flush();
    return d;
  }

  /* ---------- Static pieces ---------- */
  var xs = q(".xs"), scope = q(".scope"), doe = q(".doe");
  var siPath = q(".si"), oxPath = q(".ox"), resinPath = q(".resin"), curedPath = q(".cured");
  var orig = q(".orig"), chuck = q(".chuck"), mask = q(".mask"), rays = q(".rays");
  var stylus = q(".stylus"), arm = q(".stylus .arm"), tip = q(".stylus .tip");
  var trace = q(".trace"), traceLine = q(".trace-line");
  var inset = q(".inset"), insetImg = q(".inset-img"), insetLead = q(".inset-lead");
  var particles = Array.prototype.slice.call(svg.querySelectorAll(".particles circle"));
  var droplets = Array.prototype.slice.call(svg.querySelectorAll(".droplets circle"));
  var labelsG = q(".labels");
  var bigOp = q(".pv-big");

  set(orig, { y1: Y0, y2: Y0 });
  set(q(".trace-frame"), { y: 30, height: 74 });
  set(q(".trace-label"), { x: 40, y: 21 });
  particles.forEach(function (c) { c.setAttribute("cy", Y0 - Number(c.getAttribute("r")) + 0.5); });

  for (var rx = 42; rx <= 520; rx += 21) {
    if (rx > OX0 - 4 && rx < OX1 + 4) continue;
    el("line", { x1: rx, x2: rx, y1: 0, y2: 10 }, rays);
  }

  // Labels: one <g> each, positioned per frame
  var labels = {};
  function label(key, text, cls) {
    var g = el("g", {}, labelsG);
    var line = el("line", {}, g);
    var t = el("text", { "class": cls || "" }, g);
    t.textContent = text;
    labels[key] = { g: g, line: line, text: t };
  }
  label("si", "Si");
  label("orig", "original Si surface", "dim");
  label("ox", "SiO₂");
  label("resin", "resin · wet");
  label("mask", "mask: chrome on quartz", "dim");
  label("uv", "405 nm");
  label("trench", "trench");
  function place(key, o, tx, ty, anchor, lx, ly) {
    var L = labels[key];
    show(L.g, o);
    if (o <= 0.001) return;
    set(L.text, { x: tx, y: ty, "text-anchor": anchor || "start" });
    if (lx == null) { L.line.style.display = "none"; return; }
    L.line.style.display = "";
    set(L.line, { x1: tx + (anchor === "end" ? 2 : -2), y1: ty + 3, x2: lx, y2: ly });
  }

  // Scope grid (VGS 0..7 V, VDS 0..15 V)
  var SC = { x0: 78, x1: 500, y0: 312, y1: 78 };
  function scX(v) { return SC.x0 + (v / 7) * (SC.x1 - SC.x0); }
  function scY(v) { return SC.y0 - (v / 15) * (SC.y0 - SC.y1); }
  var grid = q(".screen-grid");
  for (var gv = 0; gv <= 7; gv++) {
    el("line", { x1: scX(gv), x2: scX(gv), y1: SC.y1, y2: SC.y0 }, grid);
    el("text", { x: scX(gv), y: SC.y0 + 15, "text-anchor": "middle" }, grid).textContent = gv;
  }
  [0, 5, 10, 15].forEach(function (v) {
    el("line", { x1: SC.x0, x2: SC.x1, y1: scY(v), y2: scY(v) }, grid);
    el("text", { x: SC.x0 - 8, y: scY(v) + 3, "text-anchor": "end" }, grid).textContent = v;
  });
  var scLine = q(".sc-line"), scDots = q(".sc-dots"), scQ = q(".sc-q"), scQLabel = q(".sc-qlabel");
  var dots = VDS.map(function (v, k) { return el("circle", { cx: scX(k * 0.5), cy: scY(v), r: 2.6 }, scDots); });
  set(scQ.querySelector("circle"), { cx: scX(QPT.vgs), cy: scY(QPT.vds) });
  set(scQLabel, { x: scX(QPT.vgs) + 14, y: scY(QPT.vds) - 10 });
  scQLabel.textContent = "Q · gain −8.48 V/V";

  // Wet-film stability grid from the FURI poster: ramp time (2, 10 s) × final speed (1500–2500, 3500 rpm),
  // each cell labelled with the time to the first dewetting site ("none" = none within 60 min).
  var DB = { x0: 150, x1: 450, y0: 298, y1: 78 };
  var dMidX = (DB.x0 + DB.x1) / 2, dMidY = (DB.y0 + DB.y1) / 2;
  var dCol = [(DB.x0 + dMidX) / 2, (dMidX + DB.x1) / 2], dRow = [(dMidY + DB.y0) / 2, (DB.y1 + dMidY) / 2];
  var dTicks = q(".doe-ticks"), dPts = q(".doe-pts");
  ["2", "10"].forEach(function (t, k) {
    el("text", { x: dCol[k], y: DB.y0 + 18, "text-anchor": "middle" }, dTicks).textContent = t;
  });
  ["1500–2500", "3500"].forEach(function (t, k) {
    el("text", { x: DB.x0 - 10, y: dRow[k] + 4, "text-anchor": "end" }, dTicks).textContent = t;
  });
  el("line", { x1: dMidX, x2: dMidX, y1: DB.y1, y2: DB.y0 }, dTicks);
  el("line", { x1: DB.x0, x2: DB.x1, y1: dMidY, y2: dMidY }, dTicks);
  var DOE_CELLS = [[0, 0, "none", true], [1, 0, "none", true], [0, 1, "0.5–1 min", false], [1, 1, "15 min", false]];
  var doeCells = DOE_CELLS.map(function (c) {
    var g = el("g", {}, dPts);
    el("circle", { cx: dCol[c[0]], cy: dRow[c[1]] - 10, r: 9, "class": c[3] ? "held" : "" }, g);
    el("text", { x: dCol[c[0]], y: dRow[c[1]] + 20, "text-anchor": "middle" }, g).textContent = c[2];
    return g;
  });
  var doeRuns = el("g", {}, dPts);
  [["6 runs", 0], ["4 runs", 1]].forEach(function (r) {
    el("text", { x: DB.x1 + 10, y: dRow[r[1]] + 4, "class": "doe-runs" }, doeRuns).textContent = r[0];
  });

  /* ---------- Panel text ---------- */
  var pvOp = document.querySelector(".pv-op b");
  var pvName = document.querySelector(".pv-name");
  var pvBar = document.querySelector(".pv-progress i");
  var pvNote = document.querySelector(".pv-note");
  var readout = document.querySelector(".readout");
  var cells = [0, 1, 2].map(function () {
    var d = document.createElement("div");
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    d.appendChild(dt); d.appendChild(dd); readout.appendChild(d);
    return { dt: dt, dd: dd };
  });
  function setReadout(rows) {
    rows.forEach(function (r, k) {
      if (cells[k].dt.textContent !== r[0]) cells[k].dt.textContent = r[0];
      if (cells[k].dd.textContent !== r[1]) cells[k].dd.textContent = r[1];
    });
  }


  /* ---------- Operations: panel text from the HTML, header nav built from the ops ---------- */
  var meta = ops.map(function (op) {
    var rows = Array.prototype.slice.call(op.querySelectorAll(".recipe tr")).slice(0, 3).map(function (tr) {
      return [tr.cells[0].textContent.trim(), tr.cells[1].textContent.trim()];
    });
    while (rows.length < 3) rows.push(["", ""]);
    return {
      no: op.querySelector(".op-no").textContent.trim(),
      name: op.querySelector(".op-title h3").textContent.trim(),
      note: op.dataset.note || "",
      stage: STAGES.indexOf(op.dataset.stage || ""),
      recipe: rows
    };
  });
  var nav = document.querySelector(".route-nav");
  var navLinks = ops.map(function (op, k) {
    var a = document.createElement("a");
    a.href = "#" + op.id;
    a.innerHTML = "<b></b><span></span>";
    a.firstChild.textContent = meta[k].no;
    a.lastChild.textContent = meta[k].name;
    if (nav) nav.appendChild(a);
    return a;
  });

  /* ---------- Frame preloading for the hold inset ---------- */
  var framesLoaded = false;
  function frameSrc(t) { return TL_BASE + "t" + ("0000" + t).slice(-5) + ".webp"; }
  function preloadFrames() {
    if (framesLoaded || !TL_TIMES.length) return;
    framesLoaded = true;
    TL_TIMES.forEach(function (t) { new Image().src = frameSrc(t); });
  }

  /* ---------- Render ---------- */
  // i is the drawing stage (index into STAGES), p its progress
  var lastFrame = -1;
  function render(i, p) {
    var g = i + p;

    // Oxide grows through op 0020; Si is consumed below the original surface (0.44 of the oxide)
    var tOx = i < 1 ? 0 : i === 1 ? DG.tMax * p : DG.tMax;
    var xOx = i < 1 ? 0 : dealGrove(tOx);
    var hOx = HOX * (i < 1 ? 0 : xOx / X_MAX);
    var ySi = Y0 + 0.44 * hOx;                 // Si / oxide interface
    var yOxTop = Y0 - 0.56 * hOx;

    // Etch (op 0080): open the oxide in the window, strip resin, then RIE through the hard mask
    var openFrac = 1, resinAlpha = 1, depth = 0, hMask = hOx;
    if (i > 7 || (i === 7)) {
      var pe = i === 7 ? p : 1;
      openFrac = 1 - ease(seg(pe, 0, 0.3));
      resinAlpha = 1 - seg(pe, 0.3, 0.45);
      var qe = seg(pe, 0.45, 1);
      depth = TRENCH * qe;
      hMask = HOX - (HOX - 3) * qe;
    }
    var maskTop = ySi - hMask;
    function oxTopAt(x) { return (x > OX0 && x < OX1) ? ySi - hMask * openFrac : maskTop; }

    // Substrate with trench
    var d = "M" + X0 + " " + f1(ySi) + "L" + OX0 + " " + f1(ySi);
    if (depth > 0.5) {
      var yb = ySi + depth;
      d += "C" + (OX0 + 1) + " " + f1(ySi + depth * 0.6) + " " + (OX0 + 4) + " " + f1(yb) + " " + (OX0 + 14) + " " + f1(yb);
      d += "L" + (OX1 - 14) + " " + f1(yb);
      d += "C" + (OX1 - 4) + " " + f1(yb) + " " + (OX1 - 1) + " " + f1(ySi + depth * 0.6) + " " + OX1 + " " + f1(ySi);
    }
    d += "L" + X1 + " " + f1(ySi) + "L" + X1 + " " + YB + "L" + X0 + " " + YB + "Z";
    siPath.setAttribute("d", d);
    oxPath.setAttribute("d", hOx > 0.3 ? bandPath(X0, X1, function () { return ySi; }, function (x) { return ySi - oxTopAt(x); }) : "");

    // Resin
    var resinShape = null, curedAlpha = 0, inFactor = 1, outLoss = 0;
    if (i === 2) {
      var pc = p;
      if (pc < 0.18) {
        var a = seg(pc, 0, 0.18);
        resinShape = { dome: true, c: 280, hw: 24 + 62 * a, H: 18 + 42 * a, k: 2 };
      } else if (pc < 0.45) {
        var b2 = seg(pc, 0.18, 0.45);
        resinShape = { dome: true, c: 280, hw: 86 + 205 * ease(b2), H: 60 - 26 * b2, k: 2 + 7 * b2 };
      } else {
        var c2 = ease(seg(pc, 0.45, 1));
        resinShape = { dome: false, T: 34 - (34 - T_RESIN) * c2, E: BEAD * c2 };
      }
    } else if (i > 2) {
      resinShape = { dome: false, T: T_RESIN, E: BEAD };
    }
    if (i === 4) curedAlpha = seg(p, 0.32, 0.86);
    if (i > 4) curedAlpha = 1;
    if (i === 5) { var dv = ease(seg(p, 0.1, 0.9)); inFactor = 1 - dv; outLoss = LOSS * dv; }
    if (i > 5) { inFactor = 0; outLoss = LOSS; }

    function baseThick(x) {
      if (!resinShape) return 0;
      if (resinShape.dome) {
        var u = Math.abs((x - resinShape.c) / resinShape.hw);
        return u >= 1 ? 0 : resinShape.H * Math.sqrt(1 - Math.pow(u, resinShape.k));
      }
      return resinShape.T + resinShape.E * (Math.exp(-Math.pow((x - X0) / 16, 2)) + Math.exp(-Math.pow((x - X1) / 16, 2)));
    }
    function inside(x) { return x > OX0 && x < OX1; }
    function resinThick(x) { return inside(x) ? baseThick(x) * inFactor : Math.max(0, baseThick(x) - outLoss); }
    var resinBase = function (x) { return oxTopAt(x); };
    resinPath.setAttribute("d", resinShape ? bandPath(X0, X1, resinBase, resinThick) : "");
    curedPath.setAttribute("d", resinShape && curedAlpha > 0 ? bandPath(X0, X1, resinBase, function (x) { return inside(x) ? 0 : resinThick(x); }) : "");
    show(resinPath, resinAlpha);
    show(curedPath, curedAlpha * resinAlpha);
    function topAt(x) { var t = resinAlpha > 0.5 ? resinThick(x) : 0; return resinBase(x) - t; }

    // 0010: particles lift off
    particles.forEach(function (c, k) {
      var f = i > 0 ? 1 : ease(seg(p, 0.12 + k * 0.1, 0.37 + k * 0.1));
      c.setAttribute("transform", "translate(0 " + f1(-46 * f) + ")");
      show(c, 1 - f);
    });

    // 0030: chuck and flung resin
    show(chuck, i === 2 ? Math.min(seg(p, 0, 0.08), 1 - seg(p, 0.92, 1)) : 0);
    droplets.forEach(function (c, k) {
      var on = i === 2 && p > 0.3 && p < 0.9;
      if (!on) { show(c, 0); return; }
      var f = ((p - 0.3) * 3.2 + k * 0.27) % 1;
      var left = k % 2 === 0;
      set(c, { cx: f1(left ? X0 - 4 - 40 * f : X1 + 4 + 40 * f), cy: f1(yOxTop - 30 - 26 * f + 30 * f * f) });
      show(c, 1 - f);
    });

    // 0050: mask and 405 nm light
    var maskY = -30, maskO = 0, raysO = 0;
    if (i === 4) {
      maskY = -30 + 196 * ease(seg(p, 0, 0.26));
      maskO = 1 - seg(p, 0.94, 1);
      raysO = seg(p, 0.24, 0.36) * (1 - seg(p, 0.86, 0.96));
    }
    mask.setAttribute("transform", "translate(0 " + f1(maskY) + ")");
    show(mask, maskO);
    var resinTopMid = topAt(120);
    Array.prototype.forEach.call(rays.children, function (ln) {
      set(ln, { y1: 20, y2: f1(resinTopMid + 4) });
    });
    show(rays, raysO);

    // 0070: stylus scan with a live height trace
    var scanF = i === 6 ? seg(p, 0.08, 0.92) : 0;
    show(stylus, i === 6 ? Math.min(seg(p, 0, 0.08), 1 - seg(p, 0.94, 1)) : 0);
    var traceO = i === 6 ? Math.min(seg(p, 0, 0.08), 1 - seg(p, 0.96, 1)) : 0;
    show(trace, traceO);
    if (i === 6) {
      var sx = X0 + 6 + (X1 - X0 - 12) * scanF;
      var sy = topAt(sx);
      arm.setAttribute("d", "M" + f1(sx) + " " + f1(sy - 15) + "L" + f1(sx) + " " + f1(sy - 52) + "L" + f1(sx + 70) + " " + f1(sy - 52));
      tip.setAttribute("d", "M" + f1(sx) + " " + f1(sy) + "l-4.5 -15h9z");
      var pts = [];
      var ref = maskTop;
      for (var tx = X0 + 6; tx <= sx; tx += 3) {
        pts.push(f1(48 + (tx - X0 - 6) / (X1 - X0 - 12) * 284) + "," + f1(96 - (ref - topAt(tx)) * 1.45));
      }
      traceLine.setAttribute("points", pts.join(" "));
    }

    // 0040: real frames in a microscope inset
    var insetO = i === 3 ? Math.min(seg(p, 0, 0.1), 1 - seg(p, 0.93, 1)) : 0;
    show(inset, insetO);
    if (i === 3 && TL_TIMES.length) {
      var fi = Math.min(TL_TIMES.length - 1, Math.floor(seg(p, 0.08, 0.9) * TL_TIMES.length));
      if (fi !== lastFrame) { insetImg.setAttribute("href", frameSrc(TL_TIMES[fi])); lastFrame = fi; }
      set(insetLead, { x1: 368, y1: 124, x2: 322, y2: f1(topAt(322)) });
    }
    if (g > 2.6) preloadFrames();

    show(bigOp, 1 - Math.max(traceO, raysO));

    // Labels
    var oxMid = (ySi + oxTopAt(70)) / 2;
    place("si", 1, 506, YB - 14, "end");
    var origO = i === 1 ? seg(p, 0.05, 0.2) : i === 2 ? 1 - seg(p, 0, 0.15) : 0;
    show(orig, origO * 0.9);
    place("orig", origO, X1 - 4, Y0 - 5 - 0.56 * hOx - 4, "end");
    place("ox", (i === 1 ? seg(p, 0.15, 0.3) : i === 2 ? 1 - seg(p, 0, 0.2) : 0) + (i === 7 ? seg(p, 0.45, 0.6) : 0),
      44, 196, "start", 72, oxMid);
    labels.ox.text.textContent = i === 7 ? "SiO₂ hard mask" : "SiO₂";
    var resinO = (i >= 2 && i <= 6) ? (i === 2 ? seg(p, 0.5, 0.65) : 1) : (i === 7 ? 1 - seg(p, 0.25, 0.35) : 0);
    labels.resin.text.textContent = curedAlpha > 0.5 ? "resin · cured" : "resin · wet";
    place("resin", (i === 3 ? resinO * (1 - insetO) : resinO) * (1 - maskO), 44, 168, "start", 84, topAt(84) + 6);
    place("mask", maskO * seg(p, 0.2, 0.3), X1, maskY - 6, "end");
    place("uv", raysO, 44, maskY - 8, "start");
    place("trench", i === 7 ? seg(p, 0.6, 0.75) : 0, 392, ySi + 46, "start", OX1 - 8, ySi + depth * 0.55);

    // Scope and DOE take over the panel for the last two operations
    var xsO = 1, scopeO = 0, doeO = 0;
    if (i === 8) { scopeO = ease(seg(p, 0, 0.22)); xsO = 1 - 0.9 * scopeO; }
    if (i === 9) { var m = ease(seg(p, 0, 0.22)); scopeO = 1 - m; doeO = m; xsO = 0.1 * (1 - m); }
    show(xs, xsO); show(scope, scopeO); show(doe, doeO);
    if (i >= 8) {
      var reveal = i === 8 ? seg(p, 0.18, 0.78) * (VDS.length - 1) : VDS.length - 1;
      var n = Math.floor(reveal), fr = reveal - n;
      var linePts = [];
      for (var k = 0; k <= n; k++) linePts.push(f1(scX(k * 0.5)) + "," + f1(scY(VDS[k])));
      if (n < VDS.length - 1) {
        linePts.push(f1(scX((n + fr) * 0.5)) + "," + f1(scY(VDS[n] + (VDS[n + 1] - VDS[n]) * fr)));
      }
      scLine.setAttribute("points", linePts.join(" "));
      dots.forEach(function (c, k) { show(c, k <= n ? 1 : 0); });
      show(scQ, i === 8 ? seg(p, 0.78, 0.88) : 1);
    }
    if (i === 9) {
      doeCells.forEach(function (c, k) { show(c, seg(p, 0.24 + k * 0.1, 0.3 + k * 0.1)); });
      show(doeRuns, seg(p, 0.66, 0.74));
    }

    // Readout
    var rows;
    switch (i) {
      case 0: rows = [["Substrate", "Si coupon"], ["Clean", "Acetone"], ["Particles", particles.filter(function (c) { return Number(c.style.opacity) > 0.5; }).length + " left"]]; break;
      case 1: rows = [["Wet O₂", Math.round(tOx) + " min"], ["Oxide, x(t)", xOx.toFixed(2) + " µm"], ["Model", "Deal–Grove fit"]]; break;
      case 2: {
        var phase, rpm, secs;
        if (p < 0.18) { phase = "Dispense"; rpm = 0; secs = 0; }
        else if (p < 0.45) { phase = "Spread"; rpm = 500; secs = 10 * seg(p, 0.18, 0.45); }
        else if (p < 0.58) { phase = "Ramp"; rpm = 500 + 1000 * seg(p, 0.45, 0.58); secs = 10 + 10 * seg(p, 0.45, 0.58); }
        else { phase = "Hold"; rpm = 1500; secs = 20 + 60 * seg(p, 0.58, 1); }
        rows = [["Phase", phase], ["Speed", Math.round(rpm / 10) * 10 + " rpm"], ["Time", Math.round(secs) + " s"]];
        break;
      }
      case 3: {
        var ti = TL_TIMES.length ? TL_TIMES[Math.max(0, lastFrame)] : 0;
        rows = [["After spin stop", clock(ti)], ["Speed · ramp", "3500 rpm · 2 s"], ["Lamp", "Capture only"]];
        break;
      }
      case 4: rows = [["Wavelength", "405 nm"], ["Exposure", Math.round(20 * seg(p, 0.3, 0.86)) + " / 20 s"], ["Resin", curedAlpha > 0.5 ? "Cured" : "Curing"]]; break;
      case 5: rows = [["Developer", "IPA, ~10 s"], ["Removed", "Uncured resin"], ["Top-layer loss", "δ ≈ 13.5 µm"]]; break;
      case 6: rows = [["Tool", "Dektak XT"], ["Stylus force", "3 mg"], ["Scan", Math.round(scanF * 100) + "%"]]; break;
      case 7: {
        if (p < 0.3) rows = [["Step", "Open hard mask"], ["Etch", "SiO₂ in window"], ["Then", "Strip resin"]];
        else if (p < 0.45) rows = [["Step", "Strip resin"], ["Hard mask", "0.171 µm SiO₂"], ["Window", "0.5 µm"]];
        else {
          var qe2 = seg(p, 0.45, 1);
          rows = [["RIE time", (9.32 * qe2).toFixed(2) + " min"], ["Depth", (1.0 * qe2).toFixed(2) + " µm"], ["Mask left", (0.171 - 0.168 * qe2).toFixed(3) + " µm"]];
        }
        break;
      }
      case 8: rows = [["Device", "CD4007 NMOS"], ["VDD / RD", "15 V / 9.94 kΩ"], ["Gain at Q", p > 0.82 ? "−8.48 V/V" : "…"]]; break;
      default: rows = [["Factors", "Speed × ramp"], ["Response", "First dewetting"], ["1500–2500 rpm", "≥ 60 min"]];
    }
    setReadout(rows);
  }

  // Panel header, watermark and note for the op in view
  function setPanel(m) {
    if (pvOp.textContent === m.no && pvName.textContent === m.name) return;
    pvOp.textContent = m.no;
    bigOp.textContent = m.no;
    pvName.textContent = m.name;
    pvNote.textContent = "Schematic, not to scale. " + m.note;
  }

  /* ---------- Scroll tracking ---------- */
  var tops = [], heights = [];
  function measure() {
    tops = ops.map(function (op) { return op.getBoundingClientRect().top + window.scrollY; });
    heights = ops.map(function (op) { return op.offsetHeight; });
  }

  var lastG = -1, signed = 0, lastNav = -2;
  function update() {
    var anchor = window.scrollY + window.innerHeight * 0.42;
    var i = 0, p = 0, inRoute = true;
    if (anchor < tops[0]) { inRoute = false; }
    else {
      for (var k = 0; k < ops.length; k++) if (anchor >= tops[k]) i = k;
      p = clamp((anchor - tops[i]) / heights[i], 0, 1);
      if (i === ops.length - 1 && anchor > tops[i] + heights[i]) inRoute = false;
    }
    var g = i + p;
    if (Math.abs(g - lastG) > 0.0004) {
      var m = meta[i];
      if (m.stage >= 0) render(m.stage, p);
      else {
        // No drawing of its own: hold the last drawn stage and show this op's recipe
        var prev = -1;
        for (var k2 = i - 1; k2 >= 0 && prev < 0; k2--) prev = meta[k2].stage;
        render(Math.max(prev, 0), prev < 0 ? 0 : 1);
        setReadout(m.recipe);
      }
      setPanel(m);
      pvBar.style.width = (p * 100).toFixed(1) + "%";
      lastG = g;
    }

    // Sign each operation once it has been passed
    while (signed < ops.length && (signed < i || (signed === i && p > 0.3) || (!inRoute && anchor >= tops[0]))) {
      ops[signed].classList.add("signed");
      signed++;
    }

    var navI = inRoute ? i : (anchor < tops[0] ? -1 : ops.length);
    if (navI !== lastNav) {
      navLinks.forEach(function (a, k) {
        a.classList.toggle("active", k === navI);
        a.classList.toggle("done", k < navI);
        if (k === navI) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current");
      });
      lastNav = navI;
    }
  }
  // Scroll events already arrive at most once per frame, so update directly
  function onScroll() { update(); }

  measure();
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { measure(); lastG = -1; onScroll(); });
  window.addEventListener("load", function () { measure(); lastG = -1; update(); });
  // Images loading inside the ops change their heights
  document.querySelectorAll(".ops img").forEach(function (img) {
    if (!img.complete) img.addEventListener("load", function () { measure(); onScroll(); }, { once: true });
  });
})();
