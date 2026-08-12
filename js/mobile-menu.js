export function initMobileMenu() {
  const toggle = document.getElementById("mobileMenuToggle");
  const closeBtn = document.getElementById("mobileMenuClose");
  const drawer = document.getElementById("mobileDrawer");

  if (!toggle || !closeBtn || !drawer) {
    return;
  }

  const links = drawer.querySelectorAll("a");
  links.forEach((link, index) => {
    link.style.setProperty("--i", index);
  });

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function openDrawer() {
    drawer.showModal();
    toggle.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        drawer.classList.add("is-open");
      });
    });
  }

  function requestClose() {
    if (!drawer.open || !drawer.classList.contains("is-open")) {
      return;
    }
    drawer.classList.remove("is-open");
    if (prefersReducedMotion()) {
      drawer.close();
    }
  }

  drawer.addEventListener("transitionend", (event) => {
    if (
      event.target === drawer &&
      event.propertyName === "transform" &&
      !drawer.classList.contains("is-open")
    ) {
      drawer.close();
    }
  });

  drawer.addEventListener("cancel", (event) => {
    event.preventDefault();
    requestClose();
  });

  drawer.addEventListener("close", () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  });

  drawer.addEventListener("click", (event) => {
    if (event.target === drawer) {
      requestClose();
    }
  });

  toggle.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", requestClose);
  links.forEach((link) => {
    link.addEventListener("click", requestClose);
  });
}
