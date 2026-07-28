/* ===== Austin Speedrun: premium interaction layer ===== */
(function () {
  'use strict';
  var mq = window.matchMedia || function () { return { matches: false }; };
  var reduce = mq('(prefers-reduced-motion: reduce)').matches;
  var noHover = mq('(hover: none)').matches;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  /* ---------- scroll progress bar ---------- */
  (function () {
    var bar = document.querySelector('.scroll-prog');
    if (!bar) return;
    var ticking = false;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (window.pageYOffset || h.scrollTop) / max : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      ticking = false;
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  })();

  /* ---------- scroll reveal (staggered) ---------- */
  (function () {
    if (reduce) return;
    var selectors = [
      '.sec-head', '.sec-lede', '.mini-label', '.steps .step', '.cards4 .gcard',
      '.ch-col', '.crowns-note', '.cd-clock', '.effort-grand', '.zip-prizes',
      '.lane', '.preview-banner', '.board-tabs', '.lb', '.gate', '.legend',
      '.ladder-title', '.rung', '.gitem', '.grind-math', '.zip-tool',
      '.cta-kicker', '.finalcta h2', '.finalcta p', '.cta-stakes', '.finalcta .btn.primary.big', '.share'
    ];
    var seen = [];
    selectors.forEach(function (s) {
      each(document.querySelectorAll(s), function (el) {
        if (seen.indexOf(el) === -1) { seen.push(el); el.classList.add('reveal'); }
      });
    });
    // stagger children inside known containers
    ['.steps', '.cards4', '.crowns-hero', '.lanes-grid', '.gates', '.ladder', '.grind-grid'].forEach(function (cSel) {
      each(document.querySelectorAll(cSel), function (c) {
        var i = 0;
        each(c.children, function (child) {
          if (child.classList.contains('reveal')) { child.style.transitionDelay = (i * 85) + 'ms'; i++; }
        });
      });
    });
    if (!('IntersectionObserver' in window)) {
      seen.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    seen.forEach(function (el) { io.observe(el); });
    setTimeout(function () { seen.forEach(function (el) { el.classList.add('in'); }); }, 4000);
  })();

  /* ---------- count-up numbers ---------- */
  (function () {
    if (reduce || !('IntersectionObserver' in window)) return;
    var targets = [];
    ['.ch-amt', '.eg-amt', '.zp-amt', '.gate b', '.finalcta p b'].forEach(function (s) {
      each(document.querySelectorAll(s), function (el) { if (el.children.length === 0) targets.push(el); });
    });
    function run(el) {
      if (el.__cu) return;
      var raw = el.textContent;
      var m = raw.match(/^(\D*)([\d][\d,]*)(.*)$/);
      if (!m) return;
      el.__cu = true;
      var pre = m[1], post = m[3], hasComma = m[2].indexOf(',') !== -1;
      var to = parseInt(m[2].replace(/,/g, ''), 10);
      if (!isFinite(to) || to <= 0) return;
      var dur = 1150, start = null;
      function fmt(n) { return hasComma ? n.toLocaleString('en-US') : String(n); }
      function step(t) {
        if (!start) start = t;
        var p = Math.min(1, (t - start) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + fmt(Math.round(to * e)) + post;
        if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
      }
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.65 });
    targets.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- confetti ---------- */
  var confetti = (function () {
    var colors = ['#567CDF', '#FF74BA', '#FFD21E', '#5CD452', '#ffffff'];
    return function (x, y) {
      if (reduce) return;
      var n = 96;
      for (var i = 0; i < n; i++) {
        var el = document.createElement('span');
        el.className = 'confetti-bit';
        var sz = 6 + Math.random() * 8;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.width = sz + 'px';
        el.style.height = (sz * 0.42 + 3) + 'px';
        el.style.background = colors[i % colors.length];
        document.body.appendChild(el);
        (function (node) {
          var ang = Math.random() * Math.PI * 2, sp = 5 + Math.random() * 10;
          var vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp - (7 + Math.random() * 5);
          var px = 0, py = 0, rot = Math.random() * 360, rs = (Math.random() - 0.5) * 34, life = 0, max = 78 + Math.random() * 24;
          function step() {
            life++; vy += 0.45; vx *= 0.99; px += vx; py += vy; rot += rs;
            node.style.transform = 'translate(' + px + 'px,' + py + 'px) rotate(' + rot + 'deg)';
            node.style.opacity = String(Math.max(0, 1 - life / max));
            if (life < max) requestAnimationFrame(step); else node.remove();
          }
          requestAnimationFrame(step);
        })(el);
      }
    };
  })();

  // confetti finale when the CTA scrolls in + on share copy
  (function () {
    var cta = document.querySelector('.finalcta');
    if (cta && 'IntersectionObserver' in window && !reduce) {
      var fired = false, armed = false;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) { armed = true; return; }
          if (armed && !fired) {
            fired = true;
            var r = e.target.getBoundingClientRect();
            confetti(r.left + r.width / 2, r.top + Math.min(r.height * 0.42, window.innerHeight * 0.42));
            io.disconnect();
          }
        });
      }, { threshold: 0.45 });
      io.observe(cta);
    }
    var share = document.getElementById('shareBtn');
    if (share) share.addEventListener('click', function () {
      var r = share.getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top + r.height / 2);
    });
  })();

  if (reduce || noHover) return; // pointer-driven effects below

  /* ---------- cursor glow ---------- */
  (function () {
    var g = document.querySelector('.cursor-glow');
    if (!g) return;
    var tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty, shown = false;
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; g.style.opacity = '1'; }
    });
    window.addEventListener('mouseout', function (e) { if (!e.relatedTarget) g.style.opacity = '0'; });
    (function loop() {
      cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
      g.style.transform = 'translate(' + (cx - 170) + 'px,' + (cy - 170) + 'px)';
      requestAnimationFrame(loop);
    })();
  })();

  /* ---------- hero parallax (uses `translate`, composes with bob/rotate) ---------- */
  (function () {
    var hero = document.querySelector('.hero-visual');
    if (!hero) return;
    var layers = hero.querySelectorAll('.fl, .hv-orb');
    if (!layers.length) return;
    var depth = [];
    each(layers, function (el) {
      depth.push(el.classList.contains('hv-orb') ? 8 : (el.classList.contains('f1') || el.classList.contains('f2') ? 30 : 18));
    });
    var tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', function (e) {
      tx = (e.clientX / innerWidth - 0.5);
      ty = (e.clientY / innerHeight - 0.5);
    });
    (function loop() {
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
      each(layers, function (el, i) {
        el.style.translate = (-cx * depth[i]).toFixed(1) + 'px ' + (-cy * depth[i]).toFixed(1) + 'px';
      });
      requestAnimationFrame(loop);
    })();
  })();

  /* ---------- 3D tilt on cards ---------- */
  (function () {
    var cards = document.querySelectorAll('.steps .step, .cards4 .gcard, .lane, .gate, .gitem');
    each(cards, function (card) {
      card.classList.add('tilt3d');
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--rx', (py * -7).toFixed(2) + 'deg');
        card.style.setProperty('--ry', (px * 9).toFixed(2) + 'deg');
      });
      card.addEventListener('mouseleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  })();
})();
