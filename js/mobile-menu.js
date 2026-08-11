export function initMobileMenu() {
  const toggle = document.getElementById("mobileMenuToggle");
  const closeBtn = document.getElementById("mobileMenuClose");
  const drawer = document.getElementById("mobileDrawer");
  const backdrop = document.getElementById("mobileDrawerBackdrop");

  if (!toggle || !closeBtn || !drawer || !backdrop) {
    return;
  }

  const links = drawer.querySelectorAll("a");

  function openDrawer() {
    drawer.inert = false;
    drawer.classList.add("is-open");
    backdrop.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    drawer.inert = true;
    drawer.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  links.forEach((link, index) => {
    link.style.setProperty("--i", index);
    link.addEventListener("click", closeDrawer);
  });
}
