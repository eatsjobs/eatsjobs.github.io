import "https://cdn.jsdelivr.net/npm/@eatsjobs/type-writer@1.2.1/+esm";

const docElement = document.documentElement;
const build = docElement.dataset.build;

const [{ initMobileMenu }, { initHeroTilt }, { initReveal }, { initPixelCam }] =
  await Promise.all([
    import(`./mobile-menu.js?v=${build}`),
    import(`./hero-tilt.js?v=${build}`),
    import(`./reveal.js?v=${build}`),
    import(`./pixel-cam.js?v=${build}`)
  ]);

// Self-registering custom element - no init call needed.
await import(`./components/accent-picker.js?v=${build}`);

initMobileMenu({
  toggleElement: document.getElementById("mobileMenuToggle"),
  closeButtonElement: document.getElementById("mobileMenuClose"),
  drawerElement: document.getElementById("mobileDrawer"),
});

initHeroTilt({
  cardElement: document.querySelector(".hero-feature"),
  glossElement: document.querySelector(".hero-feature-gloss"),
});

initReveal({
  revealElements: document.querySelectorAll(".reveal"),
});

initPixelCam({
  toggleElement: document.getElementById("pixelCamToggle"),
  heroElement: document.querySelector(".hero"),
  canvasElement: document.querySelector(".hero-pixel-canvas"),
  docElement,
});
