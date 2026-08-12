import { initHeroTilt } from "./hero-tilt.js";
import { initPixelCam } from "./pixel-cam.js";
import { initMobileMenu } from "./mobile-menu.js";

initMobileMenu({
  toggleElement: document.getElementById("mobileMenuToggle"),
  closeButtonElement: document.getElementById("mobileMenuClose"),
  drawerElement: document.getElementById("mobileDrawer"),
});

initHeroTilt({
  cardElement: document.querySelector(".hero-feature"),
  glossElement: document.querySelector(".hero-feature-gloss"),
});

initPixelCam({
  toggleElement: document.getElementById("pixelCamToggle"),
  heroElement: document.querySelector(".hero"),
  canvasElement: document.querySelector(".hero-pixel-canvas"),
  docElement: document.documentElement,
});
