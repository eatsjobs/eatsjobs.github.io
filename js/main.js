import { initHeroSmoke } from "./hero-smoke.js";
import { initHeroTilt } from "./hero-tilt.js";
import { initMobileMenu } from "./mobile-menu.js";
import { initTypewriterRestart } from "./typewriter-restart.js";

initMobileMenu({
  toggleElement: document.getElementById("mobileMenuToggle"),
  closeButtonElement: document.getElementById("mobileMenuClose"),
  drawerElement: document.getElementById("mobileDrawer"),
});

initHeroTilt({
  cardElement: document.querySelector(".hero-feature"),
  glossElement: document.querySelector(".hero-feature-gloss"),
});

initHeroSmoke({
  heroElement: document.querySelector(".hero"),
  canvasElement: document.querySelector(".hero-smoke"),
});

initTypewriterRestart({
  element: document.querySelector("type-writer"),
});
