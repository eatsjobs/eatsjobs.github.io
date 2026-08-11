# eatsjobs.github.io — Personal Portfolio Page

## Context

Pasquale needs a real, reachable personal website to use as the "Website Preview" link
in an is-a.dev PR that registers `pmangialavori.is-a.dev` (currently only a GitHub Pages
domain-verification TXT-record file, `_github-pages-challenge-eatsjobs.pmangialavori.json`,
is staged in the `is-a-dev` repo — no site exists yet). `eatsjobs.github.io` returned a 404
when checked, so this project creates that site from scratch as a new repo,
`eatsjobs/eatsjobs.github.io`, served directly by GitHub Pages from `main` (user-page repos
need no build step or Pages configuration).

The layout is modeled on umbertosantarelli.com's structure (sticky header, hero with an
accent feature card, alternating light/dark full-width sections, card-based project list),
reusing content already public in Pasquale's GitHub profile README, but with animations
reimplemented as native CSS scroll-driven animations instead of that site's
IntersectionObserver + JS approach, and with the color palette swapped to match Pasquale's
existing brand (navy/orange, already used in his GitHub profile's stats widgets) rather than
Umberto's blue/white.

## Goals

- A single-page, reachable, complete personal site: Hero, About, Skills, Projects, Contact.
- Visually distinct from a generic template — bold editorial type, generous whitespace,
  navy/orange brand carried over from the existing GitHub profile.
- Zero JavaScript except the mobile-menu open/close toggle. Scroll-linked reveal and the
  sticky-header shadow are both done with native CSS scroll-driven animations
  (`animation-timeline: view()` / `scroll(root)`), progressively enhanced via `@supports`
  so browsers without support just see static, fully visible content — never hidden or broken.
- No personal email displayed (privacy) — Contact section is social links only.
- No fabricated stats — every number shown is derived from facts Pasquale gave directly.

## Non-goals

- No Experience/Education timeline section (not selected).
- No build step, bundler, or framework.
- No custom domain / CNAME wiring yet — that's a separate, later step once
  `pmangialavori.is-a.dev` registration is actually submitted upstream.
- No blog, CMS, or dynamic content.

## File structure

```
eatsjobs.github.io/
  index.html
  styles.css
  script.js          # mobile-menu toggle only
  favicon.svg
  README.md
  docs/superpowers/specs/2026-08-11-eatsjobs-github-io-design.md
```

Plain static files — GitHub Pages serves `index.html` from `main` with no Actions workflow
needed.

## Visual design system

- **Palette** (reused from Pasquale's existing GitHub profile stats widgets, not invented):
  - `--bg-dark: #0f172a` (navy) / `--bg-light: #f8fafc` / `--surface: #ffffff`
  - `--accent: #f97316` (orange) with a lighter `--accent-soft: #fb923c` for dark-section text
  - `--ink-950` / `--ink-700` / `--ink-400` grayscale text tones for light/dark sections
- **Fonts**: "Space Grotesk" (headings, bold, tight letter-spacing) + "Inter" (body), loaded
  via Google Fonts `<link>` tags (no build step required).
- **Layout**: centered `max-width: 1200px` container, `~96px` section vertical padding,
  rounded cards (`16–20px` radius), soft shadows on dark cards only.
- **Section rhythm**: Hero → About (dark) → Skills (white) → Projects (dark) → Contact
  (light) → Footer.
- Sticky, blurred (`backdrop-filter: blur`) header with anchor nav (About / Skills /
  Projects / Contact) and a mobile hamburger drawer.

## Animation system (native CSS, no JS)

**Scroll reveal** — every section/card that should fade up on scroll gets:

```css
@supports (animation-timeline: view()) {
  .reveal {
    opacity: 0;
    animation: reveal-in linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 30%;
  }
}
@keyframes reveal-in {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: none; }
}
```

Outside `@supports`, `.reveal` elements have no `opacity: 0` at all — they're just always
visible. This means there is no JS fallback path to maintain and no risk of content being
stuck invisible.

**Header shadow on scroll** — same technique, timeline bound to the document scroll instead
of element visibility:

```css
@supports (animation-timeline: scroll()) {
  .site-header {
    animation: header-elevate linear both;
    animation-timeline: scroll(root);
    animation-range: 0px 80px;
  }
}
@keyframes header-elevate {
  from { box-shadow: none; background: rgba(15, 23, 42, 0.7); }
  to   { box-shadow: 0 12px 30px rgba(0,0,0,0.18); background: rgba(15, 23, 42, 0.92); }
}
```

Base (non-`@supports`) header styling already includes a subtle border and translucent
background, so unsupported browsers get a perfectly reasonable static header, not a broken
one.

**Accessibility**: both animation blocks are additionally wrapped so
`@media (prefers-reduced-motion: reduce)` disables them (sets `animation: none`), per
standard practice for scroll-driven/parallax effects.

**JavaScript** is limited to toggling the mobile nav drawer's open/closed state — no scroll
listeners, no IntersectionObserver.

## Content (final copy)

### Hero
- Eyebrow: `FRONTEND ENGINEER · BARCELONA`
- Title: **Pasquale Mangialavori**
- Tagline: "I build fast, well-crafted interfaces — and the open-source tools that make
  building them easier."
- CTAs: "View projects" (`#projects`), "Get in touch" (`#contact`)
- Feature card: badge `CURRENTLY AT SCANDIT`; three stats, all derived from facts Pasquale
  gave (Scandit since 2022, career start Feb 2015 at Docomo Digital, based in Barcelona):
  - `4+` "yrs @ Scandit"
  - `11+` "yrs frontend"
  - `BCN` "Barcelona"

### About (dark section)
Two-column, matching the reference site's layout:
- Left (facts): Barcelona, Spain · Scandit · Originally from Tropea, Italy · La Sapienza
  (Rome) / University of Florence (Master's)
- Right (narrative, adapted from Pasquale's existing GitHub README bio): career path —
  Docomo Digital → eDreamsOdigeo → Scandit — plus the personal touch about hobbies (beach
  volleyball, football, swimming, guitar).

### Skills (white section)
Four grouped categories, reusing the exact skill set already listed in Pasquale's GitHub
profile:
- **Languages**: JavaScript, TypeScript, Python
- **Frontend**: React, Redux, CSS3, HTML5, Vite
- **Tools**: Git, Bash, VS Code, Figma, Photoshop
- **Platforms**: Linux, macOS

### Projects (dark section)
Two cards, matching the repos Pasquale chose (currently his pinned GitHub repos):
- **media-mock** — "Simulates and mocks media devices like webcams in web applications."
  → links to `github.com/eatsjobs/media-mock`
- **ts-pattern-match** — "Simple pattern matching for JavaScript/TypeScript."
  → links to `github.com/eatsjobs/ts-pattern-match`

### Contact (light section)
Social icon links only, no email: GitHub, LinkedIn, dev.to, Medium, StackOverflow, X.

### Footer
`© <year> Pasquale Mangialavori. All rights reserved.` The year is a hardcoded static
value (not computed at runtime), since JS is scoped to the mobile-menu toggle only.

## SEO / meta

Standard `<title>`, `<meta name="description">`, Open Graph and Twitter card tags, and a
`favicon.svg`, following the same pattern as the reference site but with Pasquale's own
info (no fabricated OG image — omit `og:image` unless/until one is created).

## Testing / verification

- Open `index.html` directly in a browser (or serve via `python3 -m http.server`) and
  confirm: all sections render, nav anchors scroll correctly, mobile drawer opens/closes,
  reveal animations play on scroll in a Chromium-based browser, and the page still reads
  correctly with `prefers-reduced-motion` and in a browser without
  `animation-timeline` support (e.g. via DevTools feature toggle or an older engine) —
  content must remain fully visible either way.
- Validate HTML (no unclosed tags, valid landmarks) and check color contrast of orange
  accent text/buttons against both navy and white backgrounds meets WCAG AA.
- Once pushed to `eatsjobs/eatsjobs.github.io` and Pages is enabled, confirm
  `https://eatsjobs.github.io` returns 200 (currently 404).
