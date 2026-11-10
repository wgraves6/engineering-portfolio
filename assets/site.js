// Barcode, galleries, lightbox, defect time-lapse and analytics tags for the portfolio page.
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Barcode (decorative, drawn from the lot number) ---------- */
  document.querySelectorAll(".barcode[data-code]").forEach(function (svg) {
    var code = "*" + svg.dataset.code + "*";
    var bars = "";
    var x = 0;
    for (var i = 0; i < code.length; i++) {
      var c = code.charCodeAt(i);
      for (var b = 0; b < 5; b++) {
        var w = ((c >> b) & 1) ? 3 : 1.4;
        if (b % 2 === 0) bars += '<rect x="' + x.toFixed(1) + '" y="0" width="' + w + '" height="34"/>';
        x += w + 1.6;
      }
      x += 2;
    }
    svg.setAttribute("viewBox", "0 0 " + x.toFixed(1) + " 34");
    svg.innerHTML = bars;
  });

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = lb.querySelector(".lb-stage img");
  var lbCap = lb.querySelector(".lb-cap");
  var lbCount = lb.querySelector(".lb-count");
  var items = [];
  var index = 0;

  function show(i) {
    index = (i + items.length) % items.length;
    var it = items[index];
    lbImg.src = it.src;
    lbImg.alt = it.alt;
    lbCap.textContent = it.caption;
    lbCount.textContent = items.length > 1 ? (index + 1) + " / " + items.length : "";
    lb.querySelector(".lb-prev").hidden = items.length < 2;
    lb.querySelector(".lb-next").hidden = items.length < 2;
  }

  function open(list, i) {
    items = list;
    show(i);
    if (typeof lb.showModal === "function") lb.showModal();
    else window.open(list[i].src, "_blank");
  }

  function itemFrom(a) {
    var img = a.querySelector("img");
    return { src: a.getAttribute("href"), alt: img ? img.alt : "", caption: a.dataset.caption || (img ? img.alt : "") };
  }

  lb.querySelector(".lb-close").addEventListener("click", function () { lb.close(); });
  lb.querySelector(".lb-prev").addEventListener("click", function () { show(index - 1); });
  lb.querySelector(".lb-next").addEventListener("click", function () { show(index + 1); });
  lb.addEventListener("click", function (e) {
    if (e.target === lb || e.target.classList.contains("lb-stage") || e.target.classList.contains("lb-inner")) lb.close();
  });
  lb.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  /* ---------- Project galleries ---------- */
  document.querySelectorAll(".gallery").forEach(function (g) {
    var main = g.querySelector(".g-main");
    var mainImg = main.querySelector("img");
    var cap = g.querySelector(".g-caption");
    var thumbs = Array.prototype.slice.call(g.querySelectorAll(".g-thumbs a"));
    var list = thumbs.length ? thumbs.map(itemFrom) : [itemFrom(main)];
    var current = 0;

    thumbs.forEach(function (t, i) {
      t.addEventListener("click", function (e) {
        e.preventDefault();
        current = i;
        thumbs.forEach(function (x) { x.classList.toggle("active", x === t); });
        main.setAttribute("href", list[i].src);
        main.dataset.caption = list[i].caption;
        main.classList.toggle("photo", t.dataset.fit === "cover");
        mainImg.src = list[i].src;
        mainImg.alt = list[i].alt;
        if (cap) cap.textContent = list[i].caption;
      });
    });

    main.addEventListener("click", function (e) {
      e.preventDefault();
      open(list, current);
    });
  });

  // Single photos outside a gallery
  document.querySelectorAll("a[data-lightbox]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      open([itemFrom(a)], 0);
    });
  });

  /* ---------- Defect time-lapse ---------- */
  document.querySelectorAll(".timelapse").forEach(function (tl) {
    var base = tl.dataset.base;
    var times = tl.dataset.times.split(",").map(Number);
    var frame = tl.querySelector(".tl-frame");
    var check = tl.querySelector(".tl-check");
    var timeEl = tl.querySelector(".tl-time");
    var range = tl.querySelector(".tl-range");
    var play = tl.querySelector(".tl-play");
    var outlines = tl.querySelector(".tl-toggle input");
    var timer = null;
    var loaded = false;
    var i = 0;

    function pad(t) { return ("0000" + t).slice(-5); }
    function src(t, overlay) { return base + (overlay ? "check_t" : "t") + pad(t) + ".webp"; }
    function clock(t) { return Math.floor(t / 60) + ":" + ("0" + (t % 60)).slice(-2); }

    function preload() {
      if (loaded) return;
      loaded = true;
      times.forEach(function (t) { new Image().src = src(t, false); new Image().src = src(t, true); });
    }

    function render() {
      var t = times[i];
      frame.src = src(t, false);
      check.src = src(t, true);
      frame.alt = "Microscope view of the wet resin film " + clock(t) + " after the spin stops";
      timeEl.textContent = clock(t);
      range.value = i;
    }

    function setPlaying(on) {
      if (on && timer) return;
      if (on) {
        preload();
        if (i >= times.length - 1) i = 0;
        render();
        timer = setInterval(function () {
          if (i >= times.length - 1) { setPlaying(false); return; }
          i++;
          render();
        }, 520);
      } else {
        clearInterval(timer);
        timer = null;
      }
      play.innerHTML = '<svg width="18" height="18" aria-hidden="true"><use href="#i-' + (on ? "pause" : "play") + '"/></svg>';
      play.setAttribute("aria-label", on ? "Pause the time-lapse" : "Play the time-lapse");
    }

    range.addEventListener("input", function () {
      preload();
      setPlaying(false);
      i = Number(range.value);
      render();
    });
    play.addEventListener("click", function () { setPlaying(!timer); });
    outlines.addEventListener("change", function () { tl.classList.toggle("outlines", outlines.checked); });

    if ("IntersectionObserver" in window) {
      var played = false;
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          preload();
          if (!played && !reduceMotion && en.intersectionRatio > 0.55) {
            played = true;
            setPlaying(true);
            obs.disconnect();
          }
        });
      }, { threshold: [0, 0.6] }).observe(tl);
    }
  });

  /* ---------- Links that leave the page ---------- */
  // Write-ups, PDFs, LinkedIn and GitHub open in a new tab so the traveler stays open behind them.
  // count.js (loaded after this file) counts clicks on any element with data-goatcounter-click,
  // so name those links: résumé, poster, email, LinkedIn, the FURI expo page and each GitHub write-up.
  document.querySelectorAll("a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    var name = null;
    if (/^https?:/i.test(href) || /\.pdf$/i.test(href)) {
      a.target = "_blank";
      a.rel = "noopener";
    }
    if (/Resume\.pdf$/i.test(href)) name = "resume-pdf";
    else if (/\.pdf$/i.test(href)) name = "pdf/" + href.replace(/^.*\//, "");
    else if (href.indexOf("mailto:") === 0) name = "email";
    else if (href.indexOf("linkedin.com") > -1) name = "linkedin";
    else if (href.indexOf("forge.engineering.asu.edu") > -1) name = "furi-page";
    else if (href.indexOf("github.com") > -1) {
      var tree = href.match(/\/tree\/main\/projects\/([^#]+)/);
      name = "github/" + (tree ? tree[1] : href.replace(/^https:\/\/github\.com\//, ""));
    }
    if (name) a.setAttribute("data-goatcounter-click", name);
  });
})();
