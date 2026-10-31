// Galleries, lightbox, active-section nav and scroll reveal for the portfolio page.
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* ---------- Photo mosaic ---------- */
  document.querySelectorAll("[data-lightbox-group]").forEach(function (group) {
    var links = Array.prototype.slice.call(group.querySelectorAll("a"));
    var list = links.map(itemFrom);
    links.forEach(function (a, i) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        open(list, i);
      });
    });
  });

  /* ---------- Header shadow + active section ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']"));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);

  var lastId = null;
  function setActive() {
    var y = window.scrollY + 140;
    var active = null;
    sections.forEach(function (s) { if (s.offsetTop <= y) active = s; });
    // Past the last project section (experience, skills, contact) no tab is active
    var end = document.querySelector(".nav-end");
    if (end && end.offsetTop <= y) active = null;
    var id = active ? active.id : null;
    if (id === lastId) return;
    lastId = id;
    navLinks.forEach(function (a) {
      var on = id && a.getAttribute("href") === "#" + id;
      a.classList.toggle("active", !!on);
      if (on && window.innerWidth < 760) {
        a.parentElement.scrollTo({ left: a.offsetLeft - 16, behavior: reduceMotion ? "auto" : "smooth" });
      }
    });
  }
  window.addEventListener("scroll", setActive, { passive: true });
  setActive();

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }
})();
