const COLORS = [
  { name: "Orange", accent: "#f97316", accentOnLight: "#c2410c" },
  { name: "Blue", accent: "#38bdf8", accentOnLight: "#0369a1" },
  { name: "Matrix green", accent: "#00ff41", accentOnLight: "#15803d" },
];

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

export class AccentPicker extends HTMLElement {
  #handleClick = (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }
    const { accent, accentOnLight } = button.dataset;
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-on-light", accentOnLight);

    this.shadowRoot.querySelectorAll("button").forEach((candidate) => {
      const isSelected = candidate === button;
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
        button.setAttribute("aria-pressed", String(index === 0));
        button.classList.toggle("is-selected", index === 0);
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
