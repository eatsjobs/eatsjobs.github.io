import "https://cdn.jsdelivr.net/npm/@eatsjobs/type-writer@1.2.0/+esm";

const build = document.documentElement.dataset.build;

const [{ initMobileMenu }, { initHeroTilt }, { initReveal }] =
  await Promise.all([
    import(`./mobile-menu.js?v=${build}`),
    import(`./hero-tilt.js?v=${build}`),
    import(`./reveal.js?v=${build}`)
  ]);

initMobileMenu();
initHeroTilt();
initReveal();
