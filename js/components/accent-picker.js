// Loaded as a classic, parser-blocking <script> in <head> - not a module,
// which would defer past first paint. That means this top-level code runs
// immediately, before <body> is parsed, so a previously chosen accent is
// applied before anything renders (no flash of the default color). It
// reads the persisted accent/accentOnLight values directly, rather than an
// index into a color list, since the <accent-picker colors="..."> element
// that supplies that list lives in <body> and isn't parsed yet at this point.

const DEFAULT_COLORS = ["#f97316", "#38bdf8", "#00ff41"];

const ACCENT_KEY = "accentColor";
const ACCENT_ON_LIGHT_KEY = "accentColorOnLight";

function readStoredAccent() {
  try {
    const accent = localStorage.getItem(ACCENT_KEY);
    const accentOnLight = localStorage.getItem(ACCENT_ON_LIGHT_KEY);
    return accent && accentOnLight ? { accent, accentOnLight } : null;
  } catch {
    // localStorage unavailable (private browsing, disabled storage, etc.) - just use the default.
    return null;
  }
}

function storeAccent(accent, accentOnLight) {
  try {
    localStorage.setItem(ACCENT_KEY, accent);
    localStorage.setItem(ACCENT_ON_LIGHT_KEY, accentOnLight);
  } catch {
    // Persistence is best-effort only - the picker still works for the rest of this page view.
  }
}

function applyAccent(accent, accentOnLight) {
  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty("--accent-on-light", accentOnLight);
}

const storedAccent = readStoredAccent();
if (storedAccent) {
  applyAccent(storedAccent.accent, storedAccent.accentOnLight);
}

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    button {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      padding: 0;
      border: 2px solid transparent;
      outline-offset: 3px;
      cursor: pointer;
      transition: transform 160ms ease, border-color 160ms ease;
    }
    button:hover { transform: scale(1.15); }
    button:focus-visible { outline: 2px solid var(--accent-on-light); }
    button.is-selected { border-color: var(--ink-700); }
  </style>
`;

class AccentPicker extends HTMLElement {
  #handleClick = (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }
    const buttons = Array.from(this.shadowRoot.querySelectorAll("button"));
    const { accent, accentOnLight } = button.dataset;

    applyAccent(accent, accentOnLight);
    storeAccent(accent, accentOnLight);

    buttons.forEach((candidate) => {
      const isSelected = candidate === button;
      candidate.classList.toggle("is-selected", isSelected);
      candidate.setAttribute("aria-pressed", String(isSelected));
    });
  };

  async connectedCallback() {
    if (this.shadowRoot) {
      this.shadowRoot.addEventListener("click", this.#handleClick);
      return;
    }

    const { deriveAccentOnLight, nameFromColor, parseColorList } = await import(
      "./accent-color.js"
    );
    const colors = parseColorList(this.getAttribute("colors"));
    const palette = (colors.length > 0 ? colors : DEFAULT_COLORS).map((accent) => ({
      accent,
      accentOnLight: deriveAccentOnLight(accent),
      name: nameFromColor(accent),
    }));

    const selectedAccent = storedAccent?.accent ?? palette[0].accent;
    const selectedEntry = palette.find((entry) => entry.accent === selectedAccent) ?? palette[0];
    applyAccent(selectedEntry.accent, selectedEntry.accentOnLight);

    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(template.content.cloneNode(true));

    palette.forEach(({ name, accent, accentOnLight }) => {
      const button = document.createElement("button");
      const isSelected = accent === selectedEntry.accent;
      button.type = "button";
      button.style.background = accent;
      button.dataset.accent = accent;
      button.dataset.accentOnLight = accentOnLight;
      button.setAttribute("aria-label", `${name} accent`);
      button.setAttribute("aria-pressed", String(isSelected));
      button.classList.toggle("is-selected", isSelected);
      shadow.appendChild(button);
    });

    shadow.addEventListener("click", this.#handleClick);
  }

  disconnectedCallback() {
    this.shadowRoot?.removeEventListener("click", this.#handleClick);
  }
}

customElements.define("accent-picker", AccentPicker);
