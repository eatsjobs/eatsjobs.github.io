---
title: "animation-timeline: reverting a CSS scroll animation, then bringing it back anyway — Pasquale Mangialavori"
heading: "animation-timeline: reverting a CSS scroll animation, then bringing it back anyway"
date: 2026-08-13T18:30:00
description: "How this site's scroll-driven reveal animations use CSS animation-timeline instead of JavaScript, why an earlier attempt got reverted for IntersectionObserver, and why it came back anyway."
---
This site's content sections fade and slide into view as you scroll, and the
header gains a shadow and a bit more blur once you've scrolled past it. Neither
of those uses a scroll event listener. Both are driven entirely by
[`animation-timeline`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline),
a CSS property that ties a `@keyframes` animation's progress directly to
something other than a clock — in this case, scroll position.

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

`scroll(root)` tracks the document's own scroll offset. `animation-range: 0px 80px`
means the animation's `0%` and `100%` keyframes map onto the first 80 pixels of
scroll — past that, it just holds at `to`. No JavaScript ever runs; the browser
scrubs the animation exactly like a video, in lockstep with the scrollbar.

## The reveal effect: where it gets interesting

The `.reveal` sections use the same idea with `animation-timeline: view()`,
which ties progress to how far an element has scrolled through the viewport
rather than to the document's scroll offset. I actually implemented this twice.

The first time, it shipped, then got reverted a day later for a plain
`IntersectionObserver` + CSS transition instead. The reason: a view-timeline's
progress is tied 1:1 to scroll *offset*, not to time. That's fine — smooth,
even — under continuous scroll input like trackpad momentum. But a mouse wheel,
or a trackpad without momentum scrolling, delivers scroll in discrete jumps, and
the animation just snaps to whichever progress matches each new offset. There's
no time dimension left for an easing curve to act on, so it reads as choppy no
matter how the keyframes are shaped. A performance trace confirmed it wasn't
actual jank (0.00 CLS, nothing flagged) — the animation itself was working
exactly as specified, the spec just doesn't guarantee what I wanted for
non-continuous input.

`IntersectionObserver` fixed that structurally: it only decides *when* to flip
a class, and a real CSS transition with its own clock does the animating from
there, independent of how choppy the scroll was to trigger it. It also
sidestepped two smaller view-timeline bugs — one around mobile viewport resizing
as the address bar collapses, another where the page's last section couldn't
reach 100% progress because there wasn't enough scroll room left below it.

And then I switched back to `animation-timeline: view()` anyway, on purpose.
For this site, chunky-but-scroll-linked reads as more "alive" than
smooth-but-decoupled, and everything opts out cleanly under
`prefers-reduced-motion` regardless of which approach is running. Given the
choice, that tradeoff — knowingly, not as an oversight of the exact history
that argued against it — is the one I wanted:

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

Fully visible is the default with no `@supports` match at all — an unsupported
browser just sees static content, never a broken or permanently-hidden section.

## The bug hiding in "just animate `transform`"

Once `.reveal` landed on project cards, their hover effect
(`translateX(6px)` on `.timeline-item`, `translateY(-2px)` on `.project-card`)
quietly stopped working — only on elements that had actually finished
revealing, which made it look unrelated to the reveal animation at first.

The cause: an actively-animating CSS property always wins the cascade over a
normal rule targeting that same property, regardless of selector specificity.
The view-timeline animation was driving `transform` directly, so once it
settled, the hover rule's own `transform` had no way to win — same property,
losing side of a fight `:hover`'s specificity was never going to help with.

The fix was to stop animating `transform` at all. Both keyframes now drive two
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
`--reveal-y`/`--reveal-scale` are animation-owned now, so `:hover`'s own
`transform` rule cascades over the *composed* declaration exactly like it would
against any other plain CSS rule — because, as far as the cascade is concerned,
that's all it is.
