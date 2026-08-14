---
title: "Animation-timeline: reverting a CSS scroll animation, then bringing it back anyway — Pasquale Mangialavori"
heading: "Animation-timeline: reverting a CSS scroll animation, then bringing it back anyway"
date: 2026-08-13T18:30:00
description: "Four scroll animations on this site, four ways to be wrong about them: choppy on a mouse wheel, a cascade fight with :hover, an animation that finished within nine pixels, and a progress bar insisting you'd read 85.7% of a page you could see all of."
draft: true
---
Every scroll animation on this site has been wrong at least once, and never in
the satisfying way where something is visibly broken and you go and fix it.
Always in the annoying way, where the code does precisely what you told it to
and the result still isn't what anyone wanted.

The animations themselves are simple enough. Sections fade, slide, and gently
scale into view as you scroll. The header picks up a shadow and a more solid
background the moment the page starts moving. There's a progress bar at the top
of this page tracking how much of the article is left. None of it uses a scroll
event listener, because all of it is
[`animation-timeline`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline):
a CSS property that ties a `@keyframes` animation's progress to something other
than a clock. In this case, to scroll position.

This is the story of getting that wrong four times.

## Act zero: the one that worked

Credit where it's due — the header was fine immediately:

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
the first 80 pixels of it. Past that, the header holds at its `to` state. No
JavaScript runs; the browser scrubs the animation like a video, in lockstep
with the scrollbar. It has never given me a moment's trouble, which is why it
gets one section and everything else gets four.

## Act one: shipping it, then un-shipping it

The `.reveal` sections use the same idea with `animation-timeline: view()`,
which tracks how far an element has traveled through the viewport rather than
the document's scroll offset. I shipped that, then reverted it within hours in
favour of a plain `IntersectionObserver` and a CSS transition.

The reason is baked into what a scroll timeline *is*. Its progress is tied 1:1
to scroll offset, not to time. That's genuinely smooth under continuous input
like trackpad momentum. But a mouse wheel delivers scroll in discrete jumps,
and the animation just snaps to whichever progress matches each new offset.
There's no time dimension left for an easing curve to act on. You can reshape
the keyframes all you like — I tried — and it will still look chunky, because
easing needs a clock and there isn't one.

I ran a performance trace to make sure I wasn't chasing real jank. CLS 0.00,
nothing flagged. The animation was doing exactly what I had asked it to do.
That was the problem.

`IntersectionObserver` fixed it structurally: it only decides *when* to flip a
class, and a real CSS transition with its own clock does the animating from
there, however jumpy the scroll that triggered it. It also sidestepped two
smaller view-timeline bugs — one where the mobile viewport resizing as the
address bar collapses threw things off, and one where the page's last section
could never reach 100% progress because there wasn't enough scroll room left
below it. Remember that second one. It comes back.

And then I put `animation-timeline: view()` back anyway, on purpose, knowing
all of the above.

I still think that's the right call, which is either conviction or stubbornness
depending on the day. Chunky-but-scroll-linked feels alive in a way
smooth-but-decoupled doesn't, the whole thing opts out cleanly under
`prefers-reduced-motion` either way, and this is a personal site — the kind of
place where you're allowed to prefer the version with more character:

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

Fully visible is the default when `@supports` doesn't match, so an unsupported
browser gets static content rather than a permanently hidden section.

Keep an eye on that `animation-range` line. It's the next bug.

## Act two: the hover effect that quietly stopped working

Adding `.reveal` to the project cards surfaced something that had been broken on
the timeline items for a while without my noticing: hover transforms had stopped
happening. A `.timeline-item` is supposed to nudge right on hover
(`translateX(6px)`), a `.project-card` to lift slightly (`translateY(-2px)`).
Every hover background and border change still worked perfectly, so it looked
like a hover bug. The transform just sat there.

Better still, it only misbehaved on elements that had *finished* revealing,
which is exactly the sort of detail that sends you hunting in the wrong file.

The cause: an actively animating CSS property beats a normal rule for that same
property, no matter how specific the selector. The view-timeline animation was
driving `transform` directly, so once it settled on its final value, the hover
rule's own `transform` had no path to victory. Same property, and a fight
`:hover`'s extra specificity was never going to win.

So I stopped animating `transform` at all. The keyframes drive two typed custom
properties instead:

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

`transform: translateY(var(--reveal-y)) scale(var(--reveal-scale))` is then an
entirely ordinary, non-animated declaration built from those two values. Only
`--reveal-y` and `--reveal-scale` are animation-owned, so `:hover`'s transform
cascades over the composed declaration exactly as it would over any other plain
rule — because as far as the cascade is concerned, that's all it is.

## Act three: nine pixels

All of that shipped and looked right in a quick check. A day later, the honest
assessment: you could barely see the reveal, especially on desktop. Not choppy.
Not broken. Just over before your eye registered that anything had moved.

The culprit was `animation-range: entry 0% entry 75%`. A view timeline's `entry`
phase spans the element's *own height* — it begins as the element's top edge
crosses into the viewport and ends once the element is fully inside. The small
"About" eyebrow label is about 12px tall. Its entire entry phase is therefore
about 12px of scroll, and I had asked the animation to finish at 75% of that.

I had built a fade-and-slide animation and given it nine pixels to happen in.

Wheel, trackpad, doesn't matter. The choppiness trade-off I accepted back in act
one was real, but it had nothing to do with why *this* was invisible. I
confirmed that by scripting discrete scroll jumps and reading the computed
`opacity` at each step instead of trusting my eyes: the scroll distance needed
to complete each reveal tracked that element's height almost exactly, and most
of what reveals on this page is short.

`cover` is the phase that spans an element's entire transit through the
viewport — viewport height plus element height — so for anything smaller than
the screen the viewport dominates and element height stops mattering:

```css
.reveal {
  @supports (animation-timeline: view()) {
    animation: reveal-in linear both;
    animation-timeline: view();
    animation-range: cover 0% cover 18%;
  }
}
```

My first attempt was `cover 30%`, which measured out to a comfortable ~280px for
that eyebrow. Then I scrolled to the bottom of the page and found the Contact
section's social links stuck partway through their reveal. Permanently, because
there was no scrolling left to push the timeline any further.

That's the same last-section-can't-complete bug from act one — one of the two
that switching to `IntersectionObserver` had structurally eliminated —
faithfully reintroduced by me, asking for more scroll room than the bottom of a
page has to give.

18% measured out clean: roughly 180px of scroll instead of nine, and every
element in the Contact section reaches full opacity at maximum scroll. I checked
at two viewport heights rather than just the one I happened to have open, having
learned at least that much.

## Act four: the bar at the top of this page

Which brings us to the reading progress bar up there, added last, by someone who
had just written three acts of cautionary tale about this exact API.

It seemed easy. The bar is a 3px strip on the header's bottom edge and its fill
is a `scaleX` scrubbed by scroll. My first version used `scroll(root)`, same
timeline as the header. Then somebody sensible pointed out that a *reading*
progress bar should track the article rather than the document, and the numbers
agreed: at the last line of prose the bar read 97.8%, because the article's
bottom padding and the footer counted as "still to read." Only 2% off here, but
that error is proportional to how much of the page isn't article, so a short
post would have been badly wrong.

The fix is a named view timeline on the article itself, using the `contain`
phase — which runs from "article top at viewport top" to "article bottom at
viewport bottom," precisely what reading progress means:

```css
body {
  timeline-scope: --article;
}

.blog-post {
  view-timeline-name: --article;
}

.reading-progress {
  animation-timeline: --article;
  animation-range: contain 0% contain 100%;
}
```

`timeline-scope` on `body` is doing quiet but essential work there: the bar
lives in `<header>` and the article in `<main>`, sibling subtrees, so the
timeline name can't resolve by ancestor lookup alone.

Then I checked what happens on a post too short to scroll, and the bar
confidently reported that you'd read 85.7% of a page you could see the entirety
of. A view timeline still resolves to *something* when there's no scrolling to
be done, and that something is arbitrary. I tried five different
`animation-range` values and they landed between 43% and 86%. None of them
landed anywhere sensible, because the question itself was nonsense.

CSS has no way to ask whether the document scrolls, so the guarantee has to come
from the layout instead:

```css
.blog-post {
  min-height: calc(100svh + 180px);
}
```

`100svh` alone doesn't work, which I know because I tried it. It makes the
article exactly viewport-height, so `contain` has zero length and the bar snaps
from 0% to 100% with nothing in between. The 180px of headroom is the same
distance act three established as the point where a scroll-driven effect reads
as motion rather than a jump, and it doubles as slack for mobile, where the
viewport grows by roughly the address bar's height once it retracts.

## The actual lesson

Four bugs, and every one of them looked fine in a quick visual check. Every one
became obvious the moment it was measured — a scripted scroll and a
`getComputedStyle` call, about thirty seconds of work that I kept skipping in
favour of scrolling up and down while squinting.

Scroll-driven animations are unusually good at hiding this class of mistake.
There's no error, nothing in the console, no failed assertion. The browser does
exactly what you asked at whatever scale you accidentally asked for, and the
only way to discover that the scale was nine pixels is to go and read the
number.

So: script the scroll, read the computed style, and scroll all the way to the
bottom before trusting anything. I intend to remember this until roughly the
next time I add an animation.
