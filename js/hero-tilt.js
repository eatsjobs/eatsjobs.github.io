export function initHeroTilt({ cardElement: card, glossElement: gloss } = {}) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!card || reduceMotion) {
    return;
  }

  const maxTilt = 10;
  const enterDelay = 200;
  let isTracking = false;
  let enterTimer = null;

  function handleMove(event) {
    if (!isTracking) {
      return;
    }
    const rect = card.getBoundingClientRect();
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;
    const centerX = rect.left + halfWidth;
    const centerY = rect.top + halfHeight;
    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = Math.max(halfWidth, halfHeight);
    const degree = (distance * maxTilt) / maxDistance;
    const axisX = deltaY / halfHeight;
    const axisY = deltaX / halfWidth;
    card.style.transform =
      `perspective(700px) rotate3d(${(-axisX).toFixed(3)}, ${axisY.toFixed(3)}, 0, ${degree.toFixed(2)}deg)`;

    if (gloss) {
      const glossOpacity = Math.min(0.6, (distance * 0.6) / maxDistance);
      gloss.style.transform =
        `translate(${(-axisY * 100).toFixed(1)}%, ${(-axisX * 100).toFixed(1)}%) scale(2.2)`;
      gloss.style.opacity = glossOpacity.toFixed(2);
    }
  }

  function resetTilt() {
    card.style.transition = "transform 400ms ease";
    card.style.transform = "";
    if (gloss) {
      gloss.style.transition = "opacity 400ms ease";
      gloss.style.opacity = 0;
    }
  }

  card.addEventListener("pointerenter", () => {
    card.style.transition = "none";
    if (gloss) {
      gloss.style.transition = "none";
    }
    enterTimer = window.setTimeout(() => {
      isTracking = true;
    }, enterDelay);
  });
  card.addEventListener("pointermove", handleMove);
  card.addEventListener("pointerleave", () => {
    window.clearTimeout(enterTimer);
    isTracking = false;
    resetTilt();
  });
}
