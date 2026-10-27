// The homepage prints as a CV (css/print.css), so "Save as PDF" just opens
// the print dialog, where the browser's own Save as PDF gives the file.
export function initPrintCv({ buttonElement } = {}) {
  if (!buttonElement) {
    return;
  }

  buttonElement.addEventListener("click", () => {
    window.print();
  });
}
