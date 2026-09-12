/* ═══════════════════════════════════════════════════════════════
   JOEY — SYSTEM / interface layer
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse  = matchMedia('(pointer: coarse)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  var hasGSAP = typeof window.gsap !== 'undefined';
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ─────────────────────────────────────────────
     SMOOTH SCROLL
     ───────────────────────────────────────────── */
  var lenis = null;
  if (!reduced && !coarse && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.6 });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function loop(t) { lenis.raf(t); requestAnimationFrame(loop); })(0);
    }
  }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: -70 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  /* Re-apply cross-page anchors after the smooth scroller initialises. */
  function restoreHashTarget() {
    if (!location.hash) return;
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { id = location.hash.slice(1); }
    if (!id) return;
    var target = document.getElementById(id);
    if (target) scrollToEl(target);
  }
  if (location.hash) {
    requestAnimationFrame(function () { requestAnimationFrame(restoreHashTarget); });
    addEventListener('load', restoreHashTarget, { once: true });
  }

  /* ─────────────────────────────────────────────
     PRELOADER  →  hand-off into the field reveal
     ───────────────────────────────────────────── */
  (function preloader() {
    var pre = $('#pre');
    if (!pre) { document.body.classList.add('ready'); return; }
    var log = $('#preLog'), bar = $('#preBar'), pct = $('#prePct');

    function finish() {
      document.body.classList.add('ready');
      if (window.__fieldReveal) window.__fieldReveal();
      if (hasGSAP) {
        gsap.to(pre, {
          duration: 0.9, ease: 'expo.inOut', clipPath: 'inset(0 0 100% 0)',
          onComplete: function () { pre.remove(); ScrollTrigger.refresh(); }
        });
        gsap.from('.hero-in > *, .hero-tags', {
          duration: 1.2, y: 34, opacity: 0, stagger: 0.07, ease: 'expo.out', delay: 0.42
        });
        gsap.from('.nm .ch', {
          duration: 1.5, yPercent: 108, opacity: 0, stagger: 0.055, ease: 'expo.out', delay: 0.3
        });
      } else {
        pre.remove();
      }
    }

    if (reduced) { pre.remove(); document.body.classList.add('ready');
                   if (window.__fieldReveal) window.__fieldReveal(); return; }

    var lines = [
      'BOOT / interface',
      'LOAD / typefaces + field',
      'INDEX / 6 communities · 7 years',
      'LINK / case archive',
      'JOEY ONLINE'
    ];
    var i = 0, p = 0;
    var step = setInterval(function () {
      if (i < lines.length) {
        if (i) log.appendChild(document.createElement('br'));
        if (i === lines.length - 1) {
          log.appendChild(document.createTextNode('JOEY '));
          var online = document.createElement('b');
          online.textContent = 'ONLINE';
          log.appendChild(online);
        } else log.appendChild(document.createTextNode(lines[i]));
        i++;
      }
      p = Math.min(100, p + 21 + Math.random() * 9);
      if (bar) bar.style.transform = 'scaleX(' + (p / 100) + ')';
      if (pct) pct.textContent = String(Math.round(p)).padStart(3, '0');
      if (i >= lines.length && p >= 100) {
        clearInterval(step);
        setTimeout(finish, 340);
      }
    }, 190);
  })();

  /* ─────────────────────────────────────────────
     CUSTOM CURSOR
     ───────────────────────────────────────────── */
  (function cursor() {
    if (coarse || reduced) return;
    var ring = $('#cur'), dot = $('#curD'), lab = $('#curLab');
    if (!ring) return;
    var x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, on = false;

    addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!on) { on = true; document.body.classList.add('cur-on'); rx = x; ry = y; }
      dot.style.transform = 'translate(' + (x - 2) + 'px,' + (y - 2) + 'px)';
    }, { passive: true });
    addEventListener('pointerleave', function () { on = false; document.body.classList.remove('cur-on'); });

    (function tick() {
      rx += (x - rx) * 0.19; ry += (y - ry) * 0.19;
      ring.style.transform = 'translate(' + (rx - 19) + 'px,' + (ry - 19) + 'px)';
      requestAnimationFrame(tick);
    })();

    function bind() {
      $$('a,button,[data-cur],input,summary').forEach(function (el) {
        if (el.__curBound) return;
        el.__curBound = true;
        var label = el.getAttribute('data-cur');
        el.addEventListener('pointerenter', function () {
          if (label) { lab.textContent = label; ring.classList.add('is-lab'); }
          else ring.classList.add('is-hover');
        });
        el.addEventListener('pointerleave', function () {
          ring.classList.remove('is-hover', 'is-lab');
        });
      });
    }
    bind();
    window.__curRebind = bind;
  })();

  /* ─────────────────────────────────────────────
     NAV · MENU · PROGRESS · CHAPTER
     ───────────────────────────────────────────── */
  (function chrome() {
    var nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
    var prog = $('#prog'), chap = $('#chap'), chapN = $('#chapN'), chapT = $('#chapT'), chapR = $('#chapR');

    if (burger && menu) {
      menu.setAttribute('aria-hidden', 'true');
      function setMenu(open) {
        document.body.classList.toggle('menu-open', open);
        document.body.classList.toggle('lock', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
        menu.setAttribute('aria-hidden', open ? 'false' : 'true');
        if (lenis) open ? lenis.stop() : lenis.start();
      }
      burger.addEventListener('click', function () {
        setMenu(!document.body.classList.contains('menu-open'));
      });
      $$('a', menu).forEach(function (a) {
        a.addEventListener('click', function () {
          setMenu(false);
        });
      });
      addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
          setMenu(false);
          burger.focus();
        }
      });
    }

    var secs = $$('[data-chapter]');
    var ticking = false;
    function update() {
      var sy = window.scrollY || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - innerHeight;
      var p = max > 0 ? sy / max : 0;
      if (prog) prog.style.width = (p * 100) + '%';
      if (nav) nav.classList.toggle('solid', sy > innerHeight * 0.55);

      if (chap && secs.length) {
        var cur = null, probe = innerHeight * 0.42;
        for (var i = 0; i < secs.length; i++) {
          if (secs[i].getBoundingClientRect().top <= probe) cur = secs[i];
        }
        if (cur) {
          chap.classList.add('on');
          var n = cur.getAttribute('data-chapter'), t = cur.getAttribute('data-chapter-name');
          if (chapN.textContent !== n) { chapN.textContent = n; chapT.textContent = t; }
          var r = cur.getBoundingClientRect();
          var local = clamp((probe - r.top) / Math.max(1, r.height), 0, 1);
          if (chapR) chapR.style.transform = 'scaleX(' + local + ')';
        } else chap.classList.remove('on');
      }
      ticking = false;
    }
    addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    // in-page anchors go through the smooth scroller
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        scrollToEl(t);
      });
    });
  })();

  /* ─────────────────────────────────────────────
     REVEALS + HERO SCROLL TRANSFORM
     ───────────────────────────────────────────── */
  (function motion() {
    var items = $$('[data-rv]'), masks = $$('.ln-mask');
    if (reduced || !hasGSAP) {
      items.concat(masks).forEach(function (e) { e.classList.add('in'); });
      return;
    }
    items.forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          var d = parseFloat(el.getAttribute('data-rv-d') || 0) * 0.09;
          gsap.delayedCall(d, function () { el.classList.add('in'); });
        }
      });
    });
    masks.forEach(function (el) {
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true,
        onEnter: function () { el.classList.add('in'); } });
    });

    /* hero: the name lifts and dissolves as you leave chapter 00 */
    var hero = $('.hero');
    if (hero) {
      gsap.to('.nm', {
        yPercent: -22, opacity: 0, filter: 'blur(9px)', ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
      gsap.to('.hero-foot, .hero-tags, .cue', {
        opacity: 0, y: -30, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: '55% top', scrub: 0.6 }
      });
    }

    /* identity statement: lines stagger in, then drift on scrub */
    var st = $('.ident-stmt');
    if (st) {
      gsap.from($$('.l > span', st), {
        yPercent: 108, duration: 1.15, ease: 'expo.out', stagger: 0.085,
        scrollTrigger: { trigger: st, start: 'top 78%', once: true }
      });
    }

    /* counters */
    $$('[data-count]').forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count'));
      var dec = (el.getAttribute('data-dec') | 0);
      var suffix = el.getAttribute('data-suffix') || '';
      var o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          el.textContent = '0';   // real value ships in the HTML for no-JS
          gsap.to(o, {
            v: to, duration: 1.9, ease: 'power3.out',
            onUpdate: function () {
              el.textContent = (dec ? o.v.toFixed(dec) : Math.round(o.v).toLocaleString('en-US')) + suffix;
            }
          });
        }
      });
    });

    /* portal parallax */
    $$('.portal-bg img').forEach(function (img) {
      gsap.to(img, {
        yPercent: 9, ease: 'none',
        scrollTrigger: { trigger: img.closest('.portal'), start: 'top bottom', end: 'bottom top', scrub: 0.8 }
      });
    });
  })();

  /* ─────────────────────────────────────────────
     MAGNETIC BUTTONS
     ───────────────────────────────────────────── */
  (function magnetic() {
    if (coarse || reduced) return;
    $$('[data-mag]').forEach(function (el) {
      var r = null;
      el.addEventListener('pointerenter', function () { r = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', function (e) {
        if (!r) r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.28;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.42;
        el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        r = null;
        el.style.transition = 'transform 620ms cubic-bezier(.16,1,.3,1)';
        el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 640);
      });
    });
  })();

  /* ─────────────────────────────────────────────
     DISCIPLINE LIST + CURSOR-TRACKED PREVIEW
     ───────────────────────────────────────────── */
  (function discipline() {
    var list = $('#discList');
    if (!list) return;
    var rows = $$('.disc', list);
    var prev = $('#discPrev');
    var imgs = prev ? $$('img', prev) : [];
    var px = 0, py = 0, tx = 0, ty = 0, running = false;

    function show(i) {
      rows.forEach(function (r, k) { r.classList.toggle('on', k === i); });
      list.classList.add('active');
      if (prev) {
        prev.classList.add('on');
        imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
        if (!running) { running = true; requestAnimationFrame(follow); }
      }
    }
    function hide() {
      rows.forEach(function (r) { r.classList.remove('on'); });
      list.classList.remove('active');
      if (prev) prev.classList.remove('on');
    }
    function follow() {
      px += (tx - px) * 0.13; py += (ty - py) * 0.13;
      prev.style.transform = 'translate(' + px + 'px,' + py + 'px) translate(-50%,-50%)' +
                             (prev.classList.contains('on') ? ' scale(1)' : ' scale(.9)');
      if (prev.classList.contains('on')) requestAnimationFrame(follow);
      else running = false;
    }

    rows.forEach(function (row, i) {
      row.addEventListener('pointerenter', function () { if (!coarse) show(i); });
      row.addEventListener('focusin', function () { show(i); });
      // touch / keyboard: tap to expand the description
      row.addEventListener('click', function () {
        if (row.classList.contains('on') && coarse) hide(); else show(i);
      });
      row.setAttribute('tabindex', '0');
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); }
      });
    });
    list.addEventListener('pointerleave', function () { if (!coarse) hide(); });

    if (prev) {
      addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    }
  })();

  /* ─────────────────────────────────────────────
     NETWORK — a conceptual picture of community architecture.
     Not data: a diagram of how the parts hold together.
     ───────────────────────────────────────────── */
  (function network() {
    var cv = $('#net');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var readT = $('#netTitle'), readC = $('#netCopy');

    var HUBS = [
      { k: 'acquisition', l: 'ACQUISITION',  t: 'Acquisition & outreach',
        c: 'Bring in the right people through targeted communities, partnerships, creators and direct relationship-building — not empty vanity traffic.' },
      { k: 'onboarding',  l: 'ONBOARDING',   t: 'Onboarding & first contact',
        c: 'Move a new sign-up toward a real human interaction quickly, then give them a clear path into the culture, systems and people of the community.' },
      { k: 'engagement',  l: 'ENGAGEMENT',   t: 'Engagement & events',
        c: 'Recurring events, campaigns, world activity and feedback loops create reasons to return tomorrow instead of letting launch energy evaporate.' },
      { k: 'governance',  l: 'GOVERNANCE',   t: 'Governance & safety',
        c: 'Rules, enforcement tiers, appeals, moderation logs, verification and server security keep expectations clear when pressure arrives.' },
      { k: 'staff',       l: 'STAFF',        t: 'Staff & ownership',
        c: 'Defined roles, department heads, recruitment, training and handoff turn a founder-dependent server into a team-owned operation.' },
      { k: 'retention',   l: 'RETENTION',    t: 'Retention & growth',
        c: 'Track what keeps people active, listen to member behaviour, adjust structure and turn partnerships into compounding long-term growth.' }
    ];

    var W = 0, H = 0, dpr = 1, hubs = [], motes = [], core = null;
    var mx = -9999, my = -9999, hover = -1, locked = -1, t = 0, raf = 0, visible = true;

    function build() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      core = { x: W / 2, y: H / 2 };
      var rad = Math.min(W, H) * (W < 640 ? 0.36 : 0.33);
      var wide = W / Math.min(W, H);
      hubs = HUBS.map(function (h, i) {
        var a = (i / HUBS.length) * Math.PI * 2 - Math.PI / 2;
        return {
          d: h, a: a,
          hx: core.x + Math.cos(a) * rad * wide * 0.95,
          hy: core.y + Math.sin(a) * rad,
          x: 0, y: 0, ph: Math.random() * 6.28, glow: 0
        };
      });

      var count = W < 640 ? 34 : W < 1000 ? 52 : 74;
      motes = [];
      for (var i = 0; i < count; i++) {
        var hub = i % hubs.length;
        var ang = Math.random() * Math.PI * 2;
        var dist = 26 + Math.random() * (Math.min(W, H) * 0.17);
        motes.push({
          hub: hub, ang: ang, dist: dist,
          sp: (0.08 + Math.random() * 0.22) * (Math.random() < 0.5 ? -1 : 1),
          r: 0.9 + Math.random() * 1.7,
          ox: 0, oy: 0, x: 0, y: 0
        });
      }
    }

    function pick() {
      if (locked >= 0) return locked;
      var best = -1, bd = 62 * 62;
      for (var i = 0; i < hubs.length; i++) {
        var dx = mx - hubs[i].x, dy = my - hubs[i].y, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }

    function draw() {
      raf = 0;
      t += reduced ? 0 : 0.006;
      ctx.clearRect(0, 0, W, H);

      // hub drift
      hubs.forEach(function (h) {
        h.x = h.hx + Math.sin(t * 0.9 + h.ph) * 7;
        h.y = h.hy + Math.cos(t * 0.75 + h.ph) * 7;
      });

      var hi = pick();
      if (hi !== hover) {
        hover = hi;
        if (hi >= 0 && readT) {
          readT.textContent = hubs[hi].d.t;
          readC.textContent = hubs[hi].d.c;
        }
      }
      cv.style.cursor = hi >= 0 ? 'pointer' : 'crosshair';

      // motes orbit their hub, and shy away from the pointer
      motes.forEach(function (m) {
        var h = hubs[m.hub];
        m.ang += m.sp * 0.006;
        var bx = h.x + Math.cos(m.ang) * m.dist;
        var by = h.y + Math.sin(m.ang) * m.dist * 0.82;
        var dx = bx - mx, dy = by - my, d2 = dx * dx + dy * dy;
        if (d2 < 15000) {
          var f = (1 - d2 / 15000) * 26, d = Math.sqrt(d2) || 1;
          m.ox += ((dx / d) * f - m.ox) * 0.12;
          m.oy += ((dy / d) * f - m.oy) * 0.12;
        } else { m.ox *= 0.9; m.oy *= 0.9; }
        m.x = bx + m.ox; m.y = by + m.oy;
      });

      // hub → core spokes
      hubs.forEach(function (h, i) {
        var act = (i === hover);
        h.glow += ((act ? 1 : 0) - h.glow) * 0.14;
        var g = h.glow;
        ctx.beginPath();
        ctx.moveTo(h.x, h.y);
        var mxp = (h.x + core.x) / 2 + Math.sin(t + i) * 10;
        var myp = (h.y + core.y) / 2 + Math.cos(t + i) * 10;
        ctx.quadraticCurveTo(mxp, myp, core.x, core.y);
        ctx.strokeStyle = 'rgba(22,224,192,' + (0.10 + g * 0.55) + ')';
        ctx.lineWidth = 1 + g * 1.3;
        ctx.stroke();
      });

      // mote → hub filaments
      ctx.lineWidth = 1;
      motes.forEach(function (m) {
        var h = hubs[m.hub];
        var g = h.glow;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(h.x, h.y);
        ctx.strokeStyle = 'rgba(22,224,192,' + (0.055 + g * 0.20) + ')';
        ctx.stroke();
      });

      // motes
      motes.forEach(function (m) {
        var g = hubs[m.hub].glow;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r + g * 0.7, 0, 6.2832);
        ctx.fillStyle = 'rgba(147,163,184,' + (0.46 + g * 0.5) + ')';
        ctx.fill();
      });

      // core
      var pulse = 1 + Math.sin(t * 2.1) * 0.06;
      var cg = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, 62 * pulse);
      cg.addColorStop(0, 'rgba(22,224,192,.30)');
      cg.addColorStop(1, 'rgba(22,224,192,0)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(core.x, core.y, 62 * pulse, 0, 6.2832); ctx.fill();

      ctx.beginPath(); ctx.arc(core.x, core.y, 7.5, 0, 6.2832);
      ctx.fillStyle = '#16e0c0'; ctx.fill();
      ctx.font = '500 9px "Geist Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(238,242,248,.86)';
      ctx.fillText('COMMUNITY', core.x, core.y + 26);

      // hubs + labels
      hubs.forEach(function (h, i) {
        var g = h.glow;
        ctx.beginPath(); ctx.arc(h.x, h.y, 4.5 + g * 2.6, 0, 6.2832);
        ctx.fillStyle = g > 0.05 ? '#16e0c0' : 'rgba(147,163,184,.72)';
        ctx.fill();
        if (g > 0.02) {
          ctx.beginPath(); ctx.arc(h.x, h.y, 15 + g * 12, 0, 6.2832);
          ctx.strokeStyle = 'rgba(22,224,192,' + g * 0.45 + ')';
          ctx.lineWidth = 1; ctx.stroke();
        }
        ctx.font = '500 9.5px "Geist Mono", monospace';
        ctx.fillStyle = g > 0.05 ? 'rgba(238,242,248,.95)' : 'rgba(102,120,141,.9)';
        var dxc = h.x - core.x, dyc = h.y - core.y;
        if (Math.abs(dxc) < 40) {
          // hubs sitting on the vertical axis get the label above or below,
          // otherwise it prints straight through the node
          ctx.textAlign = 'center';
          ctx.fillText(h.d.l, h.x, h.y + (dyc < 0 ? -17 : 19));
        } else {
          ctx.textAlign = dxc < 0 ? 'right' : 'left';
          ctx.fillText(h.d.l, h.x + (dxc < 0 ? -14 : 14), h.y);
        }
      });

      if (visible && !(reduced && t > 0)) raf = requestAnimationFrame(draw);
    }

    cv.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    }, { passive: true });
    cv.addEventListener('pointerleave', function () { mx = my = -9999; });
    cv.addEventListener('click', function () {
      var i = pick();
      locked = (locked === i) ? -1 : i;
    });

    build();
    addEventListener('resize', function () { build(); }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(draw);
      }, { threshold: 0 }).observe(cv);
    }
    raf = requestAnimationFrame(draw);
    if (readT) { readT.textContent = HUBS[0].t; readC.textContent = HUBS[0].c; }
  })();

  /* ─────────────────────────────────────────────
     PAGE TRANSITIONS
     ───────────────────────────────────────────── */
  (function transitions() {
    var veil = $('#veil'), vt = $('#veilT');
    if (!veil || reduced || !hasGSAP) return;

    gsap.set(veil, { visibility: 'visible', opacity: 1, clipPath: 'inset(0 0 0 0)' });
    gsap.to(veil, {
      duration: 0.85, ease: 'expo.inOut', clipPath: 'inset(0 0 100% 0)', delay: 0.05,
      onComplete: function () { gsap.set(veil, { visibility: 'hidden', opacity: 0 }); }
    });

    var samePage = location.pathname.split('/').pop();
    $$('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank') return;
      if (/^(mailto:|tel:|https?:)/i.test(href)) return;
      if (href.split('#')[0] === samePage) return;

      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        var label = a.getAttribute('data-to') || 'Loading';
        vt.textContent = label;
        gsap.set(veil, { visibility: 'visible', opacity: 1, clipPath: 'inset(100% 0 0 0)' });
        gsap.to(veil, { duration: 0.72, ease: 'expo.inOut', clipPath: 'inset(0 0 0 0)' });
        gsap.fromTo(vt, { opacity: 0 }, { opacity: 1, duration: 0.42, delay: 0.24 });
        setTimeout(function () { location.href = href; }, 760);
      });
    });

    addEventListener('pageshow', function (e) {
      if (e.persisted) gsap.set(veil, { visibility: 'hidden', opacity: 0 });
    });
  })();

  /* ─────────────────────────────────────────────
     ROTATING ROLE LABEL
     ───────────────────────────────────────────── */
  (function roles() {
    var box = $('#roles');
    if (!box || reduced) return;
    var items = $$('span', box);
    if (items.length < 2) return;
    var i = 0;
    setInterval(function () {
      i = (i + 1) % items.length;
      items.forEach(function (s) { s.style.transform = 'translateY(' + (-i * 100) + '%)'; });
    }, 2800);
  })();

  /* ─────────────────────────────────────────────
     SHOWCASE (case-study pages)
     ───────────────────────────────────────────── */
  $$('[data-showcase]').forEach(function (sc) {
    var slides = $$('.sc-slide', sc), thumbs = $$('.sc-thumb', sc);
    var count = $('.sc-count', sc), prev = $('[data-prev]', sc), next = $('[data-next]', sc);
    if (!slides.length) return;
    var i = 0;
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      thumbs.forEach(function (b, k) {
        b.classList.toggle('on', k === i);
        b.setAttribute('aria-current', k === i ? 'true' : 'false');
      });
      if (count) count.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    }
    if (prev) prev.addEventListener('click', function () { go(i - 1); });
    if (next) next.addEventListener('click', function () { go(i + 1); });
    thumbs.forEach(function (b, k) { b.addEventListener('click', function () { go(k); }); });
    sc.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(i - 1);
      if (e.key === 'ArrowRight') go(i + 1);
    });
    go(0);
  });

  /* ─────────────────────────────────────────────
     LIGHTBOX
     ───────────────────────────────────────────── */
  (function lightbox() {
    var lb = $('#lb'); if (!lb) return;
    var img = $('#lbImg'), cap = $('#lbCap'), x = $('#lbX'), last = null;
    function open(src, alt, c) {
      last = document.activeElement;
      img.src = src; img.alt = alt || ''; cap.textContent = c || '';
      lb.classList.add('open'); document.body.classList.add('lock');
      if (lenis) lenis.stop();
      x.focus();
    }
    function close() {
      lb.classList.remove('open'); img.src = '';
      document.body.classList.remove('lock');
      if (lenis) lenis.start();
      if (last) last.focus();
    }
    x.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
    $$('.sc-slide img').forEach(function (im) {
      im.addEventListener('click', function () {
        var f = im.parentElement.querySelector('figcaption');
        open(im.src, im.alt, f ? f.textContent : '');
      });
    });
  })();

  /* ─────────────────────────────────────────────
     INTERACTIVE PLOT — real series, hover to inspect
     ───────────────────────────────────────────── */
  (function plot() {
    var wrap = $('#plot');
    if (!wrap) return;
    var line = $('.pg-line', wrap);
    if (line) {
      var len = 1400;
      try { len = Math.ceil(line.getTotalLength()) || 1400; } catch (e) {}
      line.style.setProperty('--len', len);   // property only: an inline
    }                                          // dashoffset would outrank .drawn
    var dots = $$('.pg-dot', wrap);
    dots.forEach(function (d, i) { d.style.transitionDelay = (0.85 + i * 0.055) + 's'; });

    function run() {
      wrap.classList.add('drawn');
      var num = $('#plotNum', wrap);
      if (!num || reduced || !hasGSAP) { if (num) num.textContent = num.getAttribute('data-to'); return; }
      var o = { v: 0 }, to = parseFloat(num.getAttribute('data-to').replace(/,/g, ''));
      num.textContent = '0';
      gsap.to(o, { v: to, duration: 2.1, ease: 'power3.out', delay: 0.3,
        onUpdate: function () { num.textContent = Math.round(o.v).toLocaleString('en-US'); } });
    }
    if (reduced || !('IntersectionObserver' in window)) run();
    else {
      var io = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { run(); io.disconnect(); }
      }, { threshold: 0.25 });
      io.observe(wrap);
    }

    /* hover inspection */
    var tip = $('#plotTip', wrap), scan = $('#plotScan', wrap), svg = $('svg', wrap);
    $$('.pg-hit', wrap).forEach(function (hit, i) {
      function enter() {
        var day = hit.getAttribute('data-day'), val = hit.getAttribute('data-val');
        var cx = parseFloat(hit.getAttribute('data-cx')), cy = parseFloat(hit.getAttribute('data-cy'));
        dots.forEach(function (d, k) { d.classList.toggle('hot', k === i); });
        if (scan) { scan.setAttribute('x1', cx); scan.setAttribute('x2', cx); scan.classList.add('on'); }
        if (tip && svg) {
          var box = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
          var value = document.createElement('b');
          value.textContent = val;
          tip.replaceChildren(value, document.createTextNode('Day ' + day));
          tip.style.left = (cx / vb.width * box.width) + 'px';
          tip.style.top  = (cy / vb.height * box.height) + 'px';
          tip.classList.add('on');
        }
      }
      hit.addEventListener('pointerenter', enter);
      hit.addEventListener('focus', enter);
      hit.setAttribute('tabindex', '0');
    });
    var graph = $('.plot-graph', wrap);
    if (graph) graph.addEventListener('pointerleave', function () {
      dots.forEach(function (d) { d.classList.remove('hot'); });
      if (tip) tip.classList.remove('on');
      if (scan) scan.classList.remove('on');
    });
  })();

  /* ─────────────────────────────────────────────
     CASE TIMELINE
     ───────────────────────────────────────────── */
  (function timeline() {
    var rows = $$('.tl-row');
    if (!rows.length) return;
    function open(i) { rows.forEach(function (r, k) { r.classList.toggle('on', k === i); }); }
    rows.forEach(function (r, i) {
      r.setAttribute('tabindex', '0');
      r.addEventListener('pointerenter', function () { if (!coarse) open(i); });
      r.addEventListener('click', function () { open(i); });
      r.addEventListener('focus', function () { open(i); });
      r.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });
    open(0);
  })();

  /* ─────────────────────────────────────────────
     CASE HERO PARALLAX
     ───────────────────────────────────────────── */
  (function caseHero() {
    if (reduced || !hasGSAP) return;
    var bg = $('.chero-bg img');
    if (bg) gsap.to(bg, { yPercent: 14, scale: 1.16, ease: 'none',
      scrollTrigger: { trigger: '.chero', start: 'top top', end: 'bottom top', scrub: 0.7 } });
    var inr = $('.chero-in');
    if (inr) gsap.to(inr, { y: -60, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.chero', start: 'top top', end: 'bottom top', scrub: 0.7 } });
    $$('.cnext-bg img').forEach(function (im) {
      gsap.to(im, { yPercent: 10, ease: 'none',
        scrollTrigger: { trigger: im.closest('.cnext'), start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    });
  })();


  /* ─────────────────────────────────────────────
     OWNERSHIP DIAGRAM (Crimson)
     ───────────────────────────────────────────── */
  (function ownership() {
    var wrap = $('#own');
    if (!wrap) return;
    var groups = $$('[data-own-g]', wrap);
    var btns   = $$('[data-own]', wrap);
    var cap    = $('#ownCap');
    var COPY = [
      ['Founder-dependent.', ' The owner manages every area and every decision; every escalation and question ends up with one person. It looks like control and works until that person is unavailable — then activity, moderation and momentum stop together.'],
      ['Distributed.', ' Department heads own their area, with defined escalation and accountability so responsibility does not flow back upward. This is the structure that kept running after I moved on.']
    ];

    /* exact path lengths so each link draws cleanly */
    $$('.own-link', wrap).forEach(function (l) {
      var len = 300;
      try { len = Math.ceil(l.getTotalLength()) || 300; } catch (e) {}
      l.style.setProperty('--l', len);
    });

    function show(n) {
      groups.forEach(function (g, k) { g.classList.toggle('on', k === n); });
      btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === n ? 'true' : 'false'); });
      if (cap) {
        var lead = document.createElement('b');
        lead.textContent = COPY[n][0];
        cap.replaceChildren(lead, document.createTextNode(COPY[n][1]));
      }
      // restart the draw on the group coming in
      var g = groups[n];
      if (g) $$('.own-link', g).forEach(function (l, i) { l.style.transitionDelay = (i * 0.045) + 's'; });
    }
    btns.forEach(function (b, k) { b.addEventListener('click', function () { show(k); }); });

    /* auto-advance to the distributed model once, on first view — that is the point */
    if (!reduced && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { io.disconnect(); setTimeout(function () { show(1); }, 2200); }
      }, { threshold: 0.4 });
      io.observe(wrap);
    }
    show(0);
  })();


  /* ─────────────────────────────────────────────
     ARCHIVE — filter, sort, expand
     ───────────────────────────────────────────── */
  (function archive() {
    var rec = $('#rec');
    if (!rec) return;
    var rows  = $$('.rec-row', rec);
    var empty = $('#recEmpty');
    var count = $('#recCount');
    var fBtns = $$('[data-filter]');
    var sBtns = $$('[data-sort]');
    var filter = 'all', sort = 'year';

    function apply() {
      var shown = 0;
      rows.forEach(function (r) {
        var ok = filter === 'all' || r.getAttribute('data-cat') === filter;
        r.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = shown;
      if (empty) empty.hidden = shown > 0;

      var order = rows.slice().sort(function (a, b) {
        var av = +a.getAttribute('data-order'), bv = +b.getAttribute('data-order');
        return sort === 'year' ? bv - av : av - bv;
      });
      order.forEach(function (r) { rec.insertBefore(r, empty); });
    }

    fBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        filter = b.getAttribute('data-filter');
        fBtns.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        apply();
      });
    });
    sBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        sort = b.getAttribute('data-sort');
        sBtns.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        apply();
      });
    });

    rows.forEach(function (r) {
      r.setAttribute('tabindex', '0');
      r.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;      // let the case-study link through
        r.classList.toggle('on');
      });
      r.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); r.classList.toggle('on'); }
      });
    });
    apply();
  })();

})();
