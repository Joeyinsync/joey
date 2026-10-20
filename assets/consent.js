/* ═══════════════════════════════════════════════════════════════
   CONSENT + GOOGLE ANALYTICS
   Google Analytics loads only after the visitor accepts. Until then
   no request goes to Google and no analytics cookie is set.
   The choice is kept in localStorage; "Cookie settings" in the
   footer reopens the banner.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var GA_ID = 'G-3QCQLSF911';
  var KEY = 'joey-consent';

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  var loaded = false;
  function loadGA() {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  /* remove Google Analytics cookies after a withdrawal */
  function clearGA() {
    if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0) {
        ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) {
          document.cookie = name + '=; Max-Age=0; path=/' + d;
        });
      }
    });
  }

  var bar = null;
  function hide() { if (bar) { bar.hidden = true; } }
  function show() {
    if (!bar) build();
    bar.hidden = false;
    var b = bar.querySelector('button');
    if (b) b.focus();
  }

  function build() {
    bar = document.createElement('aside');
    bar.className = 'consent';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookie consent');
    bar.hidden = true;

    var p = document.createElement('p');
    p.appendChild(document.createTextNode('With your OK, this site uses Google Analytics cookies to see which pages people visit. Nothing is set if you decline. '));
    var a = document.createElement('a');
    a.href = '/privacy.html#visiting';
    a.textContent = 'Privacy policy';
    p.appendChild(a);

    var row = document.createElement('div');
    row.className = 'consent-row';
    var yes = document.createElement('button');
    yes.type = 'button';
    yes.className = 'consent-yes';
    yes.textContent = 'Accept';
    var no = document.createElement('button');
    no.type = 'button';
    no.className = 'consent-no';
    no.textContent = 'Decline';
    yes.addEventListener('click', function () { write('granted'); hide(); loadGA(); });
    no.addEventListener('click', function () {
      var was = read() === 'granted';
      write('denied'); hide(); clearGA();
      if (was && loaded) location.reload();   // stop the already-running tag
    });
    row.appendChild(yes);
    row.appendChild(no);

    bar.appendChild(p);
    bar.appendChild(row);
    document.body.appendChild(bar);
  }

  function init() {
    var choice = read();
    if (choice === 'granted') loadGA();
    else if (choice !== 'denied') show();

    Array.prototype.forEach.call(document.querySelectorAll('[data-consent-open]'), function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); show(); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
