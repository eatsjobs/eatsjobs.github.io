(function () {
  var toggle = document.getElementById("mobileMenuToggle");
  var closeBtn = document.getElementById("mobileMenuClose");
  var drawer = document.getElementById("mobileDrawer");
  var backdrop = document.getElementById("mobileDrawerBackdrop");

  if (!toggle || !closeBtn || !drawer || !backdrop) {
    return;
  }

  var links = drawer.querySelectorAll("a");

  function openDrawer() {
    drawer.hidden = false;
    backdrop.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    drawer.hidden = true;
    backdrop.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  links.forEach(function (link) {
    link.addEventListener("click", closeDrawer);
  });
})();
