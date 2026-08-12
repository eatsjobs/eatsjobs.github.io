export function initAccentPicker({ swatchElements, docElement } = {}) {
  if (!swatchElements || !swatchElements.length || !docElement) {
    return;
  }

  swatchElements.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      docElement.style.setProperty("--accent", swatch.dataset.accent);
      docElement.style.setProperty("--accent-on-light", swatch.dataset.accentOnLight);

      swatchElements.forEach((candidate) => {
        const isSelected = candidate === swatch;
        candidate.classList.toggle("is-selected", isSelected);
        candidate.setAttribute("aria-pressed", String(isSelected));
      });
    });
  });
}
