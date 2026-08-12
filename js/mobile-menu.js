export function initMobileMenu() {
  const toggle = document.getElementById("mobileMenuToggle");
  const closeBtn = document.getElementById("mobileMenuClose");
  const drawer = document.getElementById("mobileDrawer");
  const backdrop = document.getElementById("mobileDrawerBackdrop");
  const backgroundRegions = [
    document.querySelector(".site-header"),
    document.querySelector("main"),
    document.querySelector(".site-footer")
  ].filter(Boolean);

  if (!toggle || !closeBtn || !drawer || !backdrop) {
    return;
  }

  const links = drawer.querySelectorAll("a");

  function openDrawer() {
    drawer.inert = false;
    backgroundRegions.forEach((region) => { region.inert = true; });
    drawer.classList.add("is-open");
    backdrop.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  }

  function closeDrawer() {
    drawer.inert = true;
    backgroundRegions.forEach((region) => { region.inert = false; });
    drawer.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  }

  toggle.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  links.forEach((link, index) => {
    link.style.setProperty("--i", index);
    link.addEventListener("click", closeDrawer);
  });
}
