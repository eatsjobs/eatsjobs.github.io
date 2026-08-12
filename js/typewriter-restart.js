export function initTypewriterRestart({ element } = {}) {
  if (!element) {
    return;
  }

  element.addEventListener("click", () => {
    element.restart();
  });
}
