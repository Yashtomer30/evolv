/* ------------------------------------------------------------------
   site-fixes.js — runtime companion to site-fixes.css.
   Two jobs, both defensive: nothing here runs unless the condition it
   guards against actually occurs.
     1. Keep the Cal.com iframe at its full content height, so the embed
        never has an inner scroller to trap touch gestures.
     2. Reveal any element the export left stranded at opacity:0.
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  /* 0. PAGE TITLE ------------------------------------------------ */
  /* The export carries a single hard-coded title in its shared runtime
     chunk and applies it to every route after hydration, overwriting the
     per-page <title> in the HTML. Crawlers read the static tag, but the
     browser tab would show the generic name — so re-assert the page's own
     title once the runtime has finished with it. */

  var INTENDED_TITLE = document.title;

  function keepTitle() {
    if (INTENDED_TITLE && document.title !== INTENDED_TITLE) {
      document.title = INTENDED_TITLE;
    }
  }

  /* 1. CAL.COM EMBED HEIGHT ------------------------------------- */
  /* Cal's embed posts its content height to the parent whenever the view
     changes (month -> slots -> form). We mirror that onto the iframe so
     the whole widget is laid out inline and the page does the scrolling. */

  var MIN_HEIGHT = 640;

  function calFrames() {
    return Array.prototype.filter.call(
      document.querySelectorAll("iframe"),
      function (f) { return /cal\.com/.test(f.src || ""); }
    );
  }

  function applyHeight(px) {
    var h = Math.max(parseInt(px, 10) || 0, MIN_HEIGHT);
    calFrames().forEach(function (f) {
      f.style.setProperty("height", h + "px", "important");
      var box = f.closest('[class*="cal-inline"]') || f.parentElement;
      while (box && box !== document.body) {
        if (box.style && box.style.height) {
          box.style.setProperty("height", "auto", "important");
        }
        if (getComputedStyle(box).overflowY === "scroll") {
          box.style.setProperty("overflow", "visible", "important");
        }
        box = box.parentElement;
      }
    });
  }

  window.addEventListener("message", function (e) {
    if (!/cal\.com/.test(e.origin || "")) return;
    var d = e.data;
    if (typeof d === "string") { try { d = JSON.parse(d); } catch (err) { return; } }
    if (!d || typeof d !== "object") return;

    // Cal sends { type: "__dimensionChanged", data: { iframeHeight } }
    var type = d.type || d.originator;
    var payload = d.data || d;
    var h = payload.iframeHeight || payload.height;
    if (h && /dimension|resize/i.test(String(type))) applyHeight(h);
  }, false);

  // Cal does not always announce its first layout, so seed a sane height
  // and re-assert it as the widget mounts.
  [400, 1200, 2500, 5000].forEach(function (t) {
    setTimeout(function () {
      calFrames().forEach(function (f) {
        if (f.offsetHeight < MIN_HEIGHT) applyHeight(MIN_HEIGHT);
      });
    }, t);
  });

  /* 2. STRANDED APPEAR-ANIMATIONS -------------------------------- */
  /* Framer's scroll-in animations start at opacity:0 and are revealed by
     the page bundle. On the contact page that reveal can fail (the Cal
     embed throws during init and the effect chain never completes),
     leaving the heading and intro copy permanently invisible.
     After the page has had time to settle, un-hide anything still at
     zero that holds real text. Anything the bundle animated correctly is
     already at opacity 1 by then and is left untouched. */

  function rescueHiddenText() {
    var fixed = 0;
    var nodes = document.querySelectorAll("[style*='opacity']");
    Array.prototype.forEach.call(nodes, function (el) {
      var cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) !== 0) return;
      if ((el.textContent || "").trim().length < 3) return;
      el.style.setProperty("opacity", "1", "important");
      el.style.setProperty("transform", "none", "important");
      fixed++;
    });
    return fixed;
  }

  function onReady(fn) {
    if (document.readyState === "complete") fn();
    else window.addEventListener("load", fn, { once: true });
  }

  onReady(function () {
    setTimeout(rescueHiddenText, 2000);
    setTimeout(rescueHiddenText, 4500);
    [0, 300, 1200, 3000].forEach(function (t) { setTimeout(keepTitle, t); });
  });
})();
