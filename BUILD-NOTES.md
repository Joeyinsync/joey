# Joey — portfolio rebuild

Not a reskin. New information architecture, new interaction model, new code.

## Pages
- `index.html`     — the experience. Ten chapters, 00 Arrival → 09 Contact.
- `aurora.html`    — Project Aurora case study, with the interactive launch plot.
- `crimson.html`   — Crimson Network case study, with the ownership diagram.
- `archive.html`   — filterable track record, full scope, growth detail, references, writing.
- `privacy.html`   — the original legal text, presented as system documentation.

## The seven moments
1. **Preloader** — a boot sequence that hands off directly into the field reveal.
2. **Aurora field** — a real WebGL fragment shader. Curtains hang from a wavy edge and
   break into vertical rays; the pointer bends the field and lights it locally; scroll
   lifts the curtains and dims them. No Three.js — ~4 KB of raw WebGL.
3. **Discipline list** — hover a capability: the others dim, the row shifts and expands,
   and a preview image tracks the cursor.
4. **Network** — a canvas diagram of community architecture. Six hubs, orbiting members,
   filaments to a core. Pointer repels the members; hover a hub to inspect it, click to lock.
   Labelled as conceptual, because it is: no invented data.
5. **Launch plot** (Aurora) — the real 14-day series, drawn on scroll, with per-day hover
   inspection, a scan line and a counting peak figure.
6. **Ownership diagram** (Crimson) — founder-dependent vs distributed, links drawing in.
   Auto-advances once on first view, because the switch is the argument.
7. **Page transitions** — a veil wipes in with the destination name, then out on arrival.

## Data honesty
The only numeric series on the site is Aurora's real message log:
`[9, 42, 1289, 281, 774, 1021, 683, 1201, 1210, 1910, 935, 1544, 1888, 2508]`.
Nothing else is plotted, and nothing is invented. Every stat, quote, role and date
comes from the previous site. Verified by diff: zero missing numbers, zero missing
external links except the Google Fonts endpoints, removed on purpose.

## Technical
- **No Three.js.** A fullscreen shader needs a canvas, a triangle and a fragment
  program — not 600 KB. Raw WebGL, rendered at 0.62× and upscaled (the field is soft),
  DPR capped at 1.6, idle whenever scrolled off screen.
- **GSAP + ScrollTrigger + Lenis**, self-hosted. Lenis is disabled on touch and on
  `prefers-reduced-motion`.
- **Fonts self-hosted** (Geist Variable, Geist Mono Variable, Instrument Serif — OFL,
  112 KB). No request leaves the origin.
- **CSP** is `'self'` throughout with no third-party origin at all.
- Counter figures ship as real text in the HTML and are zeroed only when the tween
  starts, so a no-JS visitor sees 2,508 rather than 0.

## Verified
- No horizontal overflow at 390 / 768 / 1440 on all five pages.
- Contrast AA everywhere (lowest 4.92:1).
- Touch targets ≥44 px on coarse pointers.
- `prefers-reduced-motion`: preloader skipped, all content visible, no animation.
- Visible focus ring on 14/14 tab stops. All images have alt text.
- Zero console errors on any page.

## Deploying
Push as-is to the GitHub Pages repo. `CNAME` (joeyinsync.com) unchanged.
