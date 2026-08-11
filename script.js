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
    var halfWidth = rect.width / 2;
    var halfHeight = rect.height / 2;
    var centerX = rect.left + halfWidth;
    var centerY = rect.top + halfHeight;
    var deltaX = event.clientX - centerX;
    var deltaY = event.clientY - centerY;
    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    var maxDistance = Math.max(halfWidth, halfHeight);
    var degree = (distance * maxTilt) / maxDistance;
    var axisX = deltaY / halfHeight;
    var axisY = deltaX / halfWidth;
    card.style.transform =
      "perspective(700px) rotate3d(" + (-axisX).toFixed(3) + ", " + axisY.toFixed(3) + ", 0, " + degree.toFixed(2) + "deg)";
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
