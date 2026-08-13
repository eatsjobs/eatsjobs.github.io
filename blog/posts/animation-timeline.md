---
title: "animation-timeline: reverting a CSS scroll animation, then bringing it back anyway — Pasquale Mangialavori"
heading: "animation-timeline: reverting a CSS scroll animation, then bringing it back anyway"
date: 2026-08-13T18:30:00
description: "How this site's scroll-driven reveal animations use CSS animation-timeline instead of JavaScript, why an earlier attempt got reverted for IntersectionObserver, why it came back anyway, and the animation-range bug that made the effect too fast to see."
---
This site's content sections fade, slide, and gently scale into view as you
scroll, and the header picks up a shadow and a more solid background the moment
the page starts moving. Neither effect uses a scroll event listener. Both are
driven entirely by
[`animation-timeline`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline),
a CSS property that ties a `@keyframes` animation's progress to something other
than a clock — in this case, scroll position.

## The header: the simple case

```css
.site-header {
  @supports (animation-timeline: scroll()) {
    animation: header-elevate linear both;
    animation-timeline: scroll(root);
    animation-range: 0px 80px;
  }
}
```

`scroll(root)` tracks the document's own scroll offset, and
`animation-range: 0px 80px` maps the animation's `0%` and `100%` keyframes onto
the first 80 pixels of it — past that, the header just holds at the `to` state.
No JavaScript ever runs; the browser scrubs the animation like a video, in
lockstep with the scrollbar.

## The reveal effect: where it gets interesting

The `.reveal` sections use the same idea with `animation-timeline: view()`,
which ties progress to how far an element has traveled through the viewport
rather than to the document's scroll offset. I ended up implementing this
twice.

The first version shipped, then got reverted within hours for a plain
`IntersectionObserver` + CSS transition. The reason: a view timeline's progress
is tied 1:1 to scroll offset, not to time. That's fine — smooth, even — under
continuous input like trackpad momentum. But a mouse wheel, or a trackpad
without momentum, delivers scroll in discrete jumps, and the animation just
snaps to whichever progress matches each new offset. There's no time dimension
left for an easing curve to work with, so it reads as choppy no matter how the
keyframes are shaped. A performance trace confirmed it wasn't actual jank
(CLS 0.00, nothing flagged); the animation was doing exactly what the spec
says, and the spec just doesn't promise what I wanted for non-continuous
input.

`IntersectionObserver` fixed that structurally. It only decides *when* to flip
a class; a real CSS transition with its own clock does the animating from
there, no matter how jumpy the triggering scroll was. It also sidestepped two
smaller view-timeline bugs: one with the mobile viewport resizing as the
address bar collapses, and one where the page's last section could never reach
100% progress because there wasn't enough scroll room left below it.

And then I switched back to `animation-timeline: view()` anyway — on purpose.
For this site, chunky-but-scroll-linked feels more alive than
smooth-but-decoupled, and either way everything opts out cleanly under
`prefers-reduced-motion`. Knowing exactly what I was trading away, this is the
version I wanted:

```css
.reveal {
  transform: translateY(var(--reveal-y)) scale(var(--reveal-scale));

  @supports (animation-timeline: view()) {
    animation: reveal-in linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 75%;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
}
```

Fully visible is the default when `@supports` doesn't match — an unsupported
browser just sees static content, never a broken or permanently hidden
section.

(Hold that `animation-range` line in mind — it turns out to be the next bug.)

## The bug hiding in "just animate `transform`"

Adding `.reveal` to the project cards surfaced a bug that had quietly been
there since the timeline items got the same treatment: hover transforms
stopped working. A `.timeline-item` is supposed to nudge right on hover
(`translateX(6px)`) and a `.project-card` to lift slightly
(`translateY(-2px)`). Instead, each hover's background and border changes
still applied, but its transform never budged — which made the reveal
animation look unrelated at first.

The cause: an actively animating CSS property always beats a normal rule for
that same property, no matter how specific the selector. The view-timeline
animation was driving `transform` directly, so once it settled, the hover
rule's own `transform` had no way to win — same property, and a fight that
`:hover`'s extra specificity was never going to settle.

The fix was to stop animating `transform` at all. The keyframes now drive two
typed custom properties instead:

```css
@property --reveal-y {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}
@property --reveal-scale {
  syntax: "<number>";
  inherits: false;
  initial-value: 1;
}
```

`transform: translateY(var(--reveal-y)) scale(var(--reveal-scale))` is then a
perfectly ordinary, non-animated declaration built from those two values. Only
`--reveal-y` and `--reveal-scale` are animation-owned, so `:hover`'s own
`transform` rule cascades over the composed declaration exactly as it would
over any other plain CSS rule — because, as far as the cascade is concerned,
that's all it is.

## `entry` vs. `cover`: an animation nobody could actually see

All of that shipped and looked right in a quick check. A day later, the honest
assessment: the reveal was barely noticeable — especially on desktop. Not
choppy, not broken. Just too fast to register as motion at all.

The cause was the `animation-range` itself. A view timeline's `entry` phase
spans the element's *own height*, not the viewport's: it starts as the
element's top edge crosses into the viewport and ends once the element is
fully inside. The small "About" eyebrow label, for example, is about 12px
tall, so its entire entry phase is about 12px of scroll — and
`entry 0% entry 75%` finished within roughly 9px. That's imperceptible on any
input device, wheel or trackpad. The choppiness tradeoff I'd accepted was
real, but it was never the reason this effect was hard to see.

I confirmed it by scripting discrete scroll jumps against the real page and
reading the computed `opacity` at each step instead of eyeballing it: the
scroll distance needed to complete each reveal tracked that element's height
almost exactly, and most of what reveals on this page is short.

`cover`'s phase spans the element's entire transit through the viewport —
viewport height plus element height — so for anything smaller than the screen,
the viewport dominates. Switching to a percentage of `cover` removes the
dependence on element size:

```css
.reveal {
  @supports (animation-timeline: view()) {
    animation: reveal-in linear both;
    animation-timeline: view();
    animation-range: cover 0% cover 18%;
  }
}
```

My first attempt was `cover 30%`, which measured out to a nicely visible
~280px for that eyebrow — and then had to be dialed back down. The Contact
section's social links are the last `.reveal` elements on the page, and
there's only so much scroll room below them before the document ends. 30%
asked for more room than that, so the last few items got stuck partway
through — permanently, since there's no scrolling left to push the timeline
further. That's the same last-section-can't-complete bug from earlier in this
story, one of the two the `IntersectionObserver` switch had fixed
structurally, quietly reintroduced by asking for more scroll room than the
bottom of the page has to give.

18% measured out clean: the reveal now runs about 20x longer than the bug it
replaces — roughly 180px of scroll instead of 9 — and every element in the
Contact section still reaches full opacity at maximum scroll. I checked at a
couple of different viewport heights, not just the one I happened to be
looking at.

If there's a lesson across all three bugs, it's that each one looked fine in a
quick visual check and became obvious the moment it was measured.
Scroll-driven animations are cheap to attach and easy to misjudge — script the
scroll, read the computed styles, and scroll all the way to the bottom before
trusting one.
