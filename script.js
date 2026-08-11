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
  links.forEach(function (link, index) {
    link.style.setProperty("--i", index);
    link.addEventListener("click", closeDrawer);
  });
})();

(function () {
  var card = document.querySelector(".hero-feature");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!card || reduceMotion) {
    return;
  }

  var maxTilt = 10;
  var enterDelay = 200;
  var isTracking = false;
  var enterTimer = null;

  function handleMove(event) {
    if (!isTracking) {
      return;
    }
    var rect = card.getBoundingClientRect();
    var px = (event.clientX - rect.left) / rect.width;
    var py = (event.clientY - rect.top) / rect.height;
    var rotateY = (px - 0.5) * maxTilt * 2;
    var rotateX = (0.5 - py) * maxTilt * 2;
    card.style.transform =
      "perspective(700px) rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg)";
  }

  function resetTilt() {
    card.style.transition = "transform 400ms ease";
    card.style.transform = "";
  }

  card.addEventListener("pointerenter", function () {
    card.style.transition = "none";
    enterTimer = window.setTimeout(function () {
      isTracking = true;
    }, enterDelay);
  });
  card.addEventListener("pointermove", handleMove);
  card.addEventListener("pointerleave", function () {
    window.clearTimeout(enterTimer);
    isTracking = false;
    resetTilt();
  });
})();
