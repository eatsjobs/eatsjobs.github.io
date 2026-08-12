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
  connectedCallback() {
    if (this.shadowRoot) {
      return;
    }
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(template.content.cloneNode(true));

    const buttons = COLORS.map(({ name, accent, accentOnLight }, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.style.background = accent;
      button.setAttribute("aria-label", `${name} accent`);
      button.setAttribute("aria-pressed", String(index === 0));
      button.classList.toggle("is-selected", index === 0);

      button.addEventListener("click", () => {
        document.documentElement.style.setProperty("--accent", accent);
        document.documentElement.style.setProperty("--accent-on-light", accentOnLight);
        buttons.forEach((candidate, candidateIndex) => {
          const isSelected = candidateIndex === index;
          candidate.classList.toggle("is-selected", isSelected);
          candidate.setAttribute("aria-pressed", String(isSelected));
        });
      });

      shadow.appendChild(button);
      return button;
    });
  }
}

customElements.define("accent-picker", AccentPicker);
