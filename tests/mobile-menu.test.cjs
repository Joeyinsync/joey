// Dependency-free regression tests for the shared navigation controller.
// Run: node --test tests/mobile-menu.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/core.css'), 'utf8');
const start = app.indexOf('    var nav =');
const end = app.indexOf('    var secs =', start);
assert(start >= 0 && end > start, 'Shared menu controller must be present');
const controller = app.slice(start, end);
const pages = ['index.html', 'aurora.html', 'crimson.html', 'archive.html', 'privacy.html'];

function element(classNames = '') {
  const classes = new Set(classNames.split(/\s+/).filter(Boolean));
  return {
    attributes: {}, events: {}, focused: false,
    classList: {
      contains: value => classes.has(value),
      toggle(value, enabled = !classes.has(value)) {
        if (enabled) classes.add(value); else classes.delete(value);
        return enabled;
      }
    },
    setAttribute(name, value) { this.attributes[name] = value; },
    getAttribute(name) { return this.attributes[name]; },
    addEventListener(name, handler) { (this.events[name] ||= []).push(handler); },
    dispatch(name, event = {}) { (this.events[name] || []).forEach(handler => handler(event)); },
    focus() { this.focused = true; }
  };
}

function mount(page, smooth) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert.equal((html.match(/id="burger"/g) || []).length, 1);
  assert.equal((html.match(/id="menu"/g) || []).length, 1);
  const markup = html.match(/<nav class="menu" id="menu"[^>]*>([\s\S]*?)<\/nav>/);
  assert(markup, page + ': menu markup missing');
  const links = [...markup[1].matchAll(/<a href="([^"]+)"[^>]*>/g)].map(match => {
    const link = element(); link.href = match[1]; return link;
  });
  assert(links.length >= 4, page + ': expected menu destinations');
  const body = element('ready');
  const burger = element('burger');
  const menu = element('menu');
  const win = element();
  const viewport = element(); viewport.matches = true;
  const lenis = smooth ? { stopped: false, stop() { this.stopped = true; }, start() { this.stopped = false; } } : null;
  const nodes = { '#nav': element('nav'), '#burger': burger, '#menu': menu };
  vm.runInNewContext(controller, {
    document: { body }, lenis,
    $: selector => nodes[selector] || null,
    $$: (selector, context) => selector === 'a' && context === menu ? links : [],
    addEventListener: win.addEventListener.bind(win),
    matchMedia: () => viewport
  });
  return { body, burger, menu, links, win, lenis, viewport };
}

for (const page of pages) {
  for (const smooth of [false, true]) {
    test(`${page}: open, close, links and Escape (${smooth ? 'with scroller' : 'without scroller'})`, () => {
      const state = mount(page, smooth);
      const { body, burger, menu, links, win, lenis } = state;
      const closed = () => {
        assert(!body.classList.contains('menu-open'));
        assert(!body.classList.contains('lock'));
        assert.equal(burger.getAttribute('aria-expanded'), 'false');
        assert.equal(menu.getAttribute('aria-hidden'), 'true');
        if (lenis) assert(!lenis.stopped);
      };
      const open = () => {
        burger.dispatch('click');
        // The original bug: body.menu matched the hidden panel's .menu CSS.
        assert(!body.classList.contains('menu'), 'Opening the menu must NOT give body the panel class .menu');
        assert(body.classList.contains('menu-open'));
        assert(body.classList.contains('ready'), 'Preserve unrelated page state');
        assert(body.classList.contains('lock'));
        assert.equal(burger.getAttribute('aria-expanded'), 'true');
        assert.equal(burger.getAttribute('aria-label'), 'Close menu');
        assert.equal(menu.getAttribute('aria-hidden'), 'false');
        if (lenis) assert(lenis.stopped);
      };
      open(); burger.dispatch('click'); closed();
      for (const link of links) { open(); link.dispatch('click'); closed(); }
      open(); win.dispatch('keydown', { key: 'Escape' }); closed();
      assert(burger.focused, 'Escape returns focus to the menu button');
      open(); burger.dispatch('click'); open(); burger.dispatch('click'); closed();
    });
  }
}

test('The hidden panel CSS is scoped to nav.menu, never to body', () => {
  assert.match(css, /nav\.menu\s*\{[^}]*opacity:0;visibility:hidden/s);
  assert.doesNotMatch(css, /(^|[\s{}])\.menu(?=[\s{:.>])/m, 'Bare .menu selectors can accidentally style body');
  assert.match(css, /body\.menu-open nav\.menu\s*\{[^}]*opacity:1;visibility:visible/s);
  assert.doesNotMatch(css, /body\.menu(?!-)/);
});
