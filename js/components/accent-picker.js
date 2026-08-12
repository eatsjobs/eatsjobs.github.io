// Loaded as a classic, parser-blocking <script> in <head> - not a module,
// which would defer past first paint. That means this top-level code runs
// immediately, before <body> is parsed, so the persisted accent is applied
// before anything renders (no flash of the default color).

const COLORS = [
  { name: "Orange", accent: "#f97316", accentOnLight: "#c2410c" },
  { name: "Blue", accent: "#38bdf8", accentOnLight: "#0369a1" },
  { name: "Matrix green", accent: "#00ff41", accentOnLight: "#15803d" },
];

const STORAGE_KEY = "accentColorIndex";

function readStoredIndex() {
  try {
    const index = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(index) && index >= 0 && index < COLORS.length ? index : 0;
  } catch {
    // localStorage unavailable (private browsing, disabled storage, etc.) - just start at the default.
    return 0;
  }
}

function storeIndex(index) {
  try {
    localStorage.setItem(STORAGE_KEY, String(index));
  } catch {
    // Persistence is best-effort only - the picker still works for the rest of this page view.
  }
}

const selectedIndex = readStoredIndex();
const selected = COLORS[selectedIndex];
document.documentElement.style.setProperty("--accent", selected.accent);
document.documentElement.style.setProperty("--accent-on-light", selected.accentOnLight);

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
    const index = buttons.indexOf(button);
    const { accent, accentOnLight } = button.dataset;

    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-on-light", accentOnLight);
    storeIndex(index);

    buttons.forEach((candidate, candidateIndex) => {
      const isSelected = candidateIndex === index;
      candidate.classList.toggle("is-selected", isSelected);
      candidate.setAttribute("aria-pressed", String(isSelected));
    });
  };

  connectedCallback() {
    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: "open" });
      shadow.appendChild(template.content.cloneNode(true));

      COLORS.forEach(({ name, accent, accentOnLight }, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.style.background = accent;
        button.dataset.accent = accent;
        button.dataset.accentOnLight = accentOnLight;
        button.setAttribute("aria-label", `${name} accent`);
        button.setAttribute("aria-pressed", String(index === selectedIndex));
        button.classList.toggle("is-selected", index === selectedIndex);
        shadow.appendChild(button);
      });
    }

    this.shadowRoot.addEventListener("click", this.#handleClick);
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener("click", this.#handleClick);
  }
}

customElements.define("accent-picker", AccentPicker);
