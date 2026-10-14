/* M/J Language Arts 3, Semester 2: Daily Practice extras + in-lesson write boxes.
   Storage root is shared with project.js: opt.ela8s2.<lesson>.<key>

   In-lesson write box (regular lesson pages, no project.js on the page):
     <body data-dp-lesson="m4-w1-mon-grammar-1">
     .wbox textarea[data-key="imagery"]          autosaves to opt.ela8s2.m4-w1-mon-grammar-1.imagery
     details.wbox-reveal[data-for="imagery"]     the example stays shut until the box has writing in it

   Daily Practice pages (with project.js, body data-ns="ela8s2" data-lesson="m4-w1-dp"):
     .ticks[data-key] > button.tick              proofread ticks, saved
     .order[data-key] > .ord-pool > button.ord-item[data-pos="1..n"], .ord-check, .ord-reset, .ord-fb
     .draw > .dr-btn, .dr-left, .slip (any number) draws one unseen slip at a time
     .fire[data-count]                           signal-fire meter: one flame per answered required box on the page
*/
(function () {
  "use strict";
  var ROOT = "opt.ela8s2.";
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v === "" || v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  var body = document.body;

  /* ---------- in-lesson write boxes ---------- */
  var LESSON = body.getAttribute("data-dp-lesson");
  if (LESSON) {
    var NS = ROOT + LESSON + ".";
    document.querySelectorAll(".wbox textarea[data-key]").forEach(function (ta) {
      var k = ta.getAttribute("data-key");
      var saved = get(NS + k); if (saved != null) ta.value = saved;
      var dot = ta.closest(".wbox").querySelector(".wbox-dot");
      function mark() { if (dot) dot.classList.toggle("saved", ta.value.trim().length > 0); lockReveals(); }
      ta.addEventListener("input", function () { set(NS + k, ta.value); mark(); });
      mark();
    });
  }
  function lockReveals() {
    document.querySelectorAll("details.wbox-reveal[data-for]").forEach(function (d) {
      var ta = document.querySelector('.wbox textarea[data-key="' + d.getAttribute("data-for") + '"]');
      var empty = !ta || !ta.value.trim();
      d.classList.toggle("locked", empty);
      if (empty) d.open = false;
    });
  }
  document.querySelectorAll("details.wbox-reveal[data-for]").forEach(function (d) {
    var hint = document.createElement("div"); hint.className = "wbox-hint"; hint.textContent = "Write yours first, then compare.";
    d.parentNode.insertBefore(hint, d.nextSibling);
    d.querySelector("summary").addEventListener("click", function (e) {
      if (d.classList.contains("locked")) { e.preventDefault(); hint.classList.add("show"); setTimeout(function () { hint.classList.remove("show"); }, 2600); }
    });
  });
  lockReveals();

  /* ---------- Daily Practice extras ---------- */
  var DPNS = ROOT + (body.getAttribute("data-lesson") || "dp") + ".";

  document.querySelectorAll(".ticks[data-key]").forEach(function (g) {
    var k = DPNS + "ticks." + g.getAttribute("data-key");
    var on = (get(k) || "").split("|").filter(Boolean);
    g.querySelectorAll(".tick").forEach(function (t, i) {
      if (on.indexOf(String(i)) > -1) t.classList.add("on");
      t.addEventListener("click", function () {
        t.classList.toggle("on");
        var v = []; g.querySelectorAll(".tick").forEach(function (x, j) { if (x.classList.contains("on")) v.push(j); });
        set(k, v.join("|"));
      });
    });
  });

  document.querySelectorAll(".order[data-key]").forEach(function (o) {
    var k = DPNS + "order." + o.getAttribute("data-key");
    var items = Array.prototype.slice.call(o.querySelectorAll(".ord-item"));
    var fb = o.querySelector(".ord-fb");
    var seq = (get(k) || "").split("|").filter(Boolean).map(Number);
    function paint() {
      items.forEach(function (it, i) {
        var at = seq.indexOf(i);
        it.classList.toggle("picked", at > -1);
        it.querySelector(".ord-n").textContent = at > -1 ? String(at + 1) : "";
        it.classList.remove("right", "wrong");
      });
      if (fb) fb.textContent = seq.length < items.length ? "Click the events in the order they happen." : "All placed. Check your order.";
    }
    items.forEach(function (it, i) {
      it.addEventListener("click", function () {
        var at = seq.indexOf(i);
        if (at > -1) seq = seq.slice(0, at); else seq.push(i);
        set(k, seq.join("|")); paint();
      });
    });
    var chk = o.querySelector(".ord-check");
    if (chk) chk.addEventListener("click", function () {
      if (seq.length < items.length) { if (fb) fb.textContent = "Place every event first."; return; }
      var right = 0;
      seq.forEach(function (idx, place) {
        var ok = Number(items[idx].getAttribute("data-pos")) === place + 1;
        items[idx].classList.toggle("right", ok); items[idx].classList.toggle("wrong", !ok);
        if (ok) right++;
      });
      if (fb) fb.textContent = right === items.length ? "Every event is in order. Use this order for your retell." : right + " of " + items.length + " are in the right place. Click a red one to take it and everything after it back, then try again.";
    });
    var rs = o.querySelector(".ord-reset");
    if (rs) rs.addEventListener("click", function () { seq = []; set(k, ""); paint(); });
    paint();
  });

  document.querySelectorAll(".draw").forEach(function (d) {
    var slips = Array.prototype.slice.call(d.querySelectorAll(".slip"));
    var btn = d.querySelector(".dr-btn"), left = d.querySelector(".dr-left");
    var drawn = [];
    function count() { if (left) left.textContent = (slips.length - drawn.length) + " of " + slips.length + " slips left in the box"; }
    if (btn) btn.addEventListener("click", function () {
      var pool = []; slips.forEach(function (s, i) { if (drawn.indexOf(i) < 0) pool.push(i); });
      if (!pool.length) { if (left) left.textContent = "The box is empty. Every slip has been drawn."; return; }
      var pick = pool[Math.floor(Math.random() * pool.length)];
      drawn.push(pick); slips[pick].classList.add("shown");
      slips[pick].scrollIntoView({ behavior: "smooth", block: "nearest" });
      count();
    });
    count();
  });

  document.querySelectorAll(".fire").forEach(function (f) {
    var n = Number(f.getAttribute("data-count")) || 6;
    for (var i = 0; i < n; i++) f.appendChild(document.createElement("span"));
    function paint() {
      var req = document.querySelectorAll(".answer[data-required]"), done = 0;
      req.forEach(function (el) { if ((el.value || "").trim()) done++; });
      var lit = req.length ? Math.round(done / req.length * n) : 0;
      f.querySelectorAll("span").forEach(function (s, i) { s.classList.toggle("lit", i < lit); s.style.height = (i < lit ? 18 + i * 5 : 10) + "px"; });
      var cap = f.parentNode.querySelector(".fire-cap"); if (cap) cap.textContent = done + " of " + req.length + " pieces written";
    }
    document.addEventListener("input", paint); paint();
  });
})();
