// Eleventy filters over _data/resume.json, the single source for the
// homepage's experience and projects, /resume.json and the printed CV.
// Build-time only, which is why this lives outside the published js/.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Role summaries may hold Markdown-style [text](url) links, the one bit of
// markup the site needs inside them.
const INLINE_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

// "2022-09" -> "Sep 2022". JSON Resume leaves endDate out for a current role.
export function monthYear(date) {
  if (!date) {
    return "Present";
  }
  const [year, month] = date.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

// JSON Resume lists one entry per position; the timeline nests consecutive
// positions at the same company under one heading, newest first, spanning
// from the earliest start to the latest end.
export function groupWork(work) {
  const companies = [];
  for (const position of work) {
    const previous = companies.at(-1);
    if (previous?.name === position.name) {
      previous.positions.push(position);
    } else {
      companies.push({ name: position.name, location: position.location, positions: [position] });
    }
  }
  return companies.map((company) => {
    const isCurrent = company.positions.some((position) => !position.endDate);
    // ISO dates sort as strings.
    const starts = company.positions.map((position) => position.startDate).sort();
    const ends = company.positions.map((position) => position.endDate).sort();
    return {
      ...company,
      isCurrent,
      startDate: starts[0],
      endDate: isCurrent ? undefined : ends.at(-1),
    };
  });
}

export function printableUrl(url) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function inlineLinks(text) {
  let html = "";
  let last = 0;
  for (const match of text.matchAll(INLINE_LINK)) {
    const [whole, label, url] = match;
    html += escapeHtml(text.slice(last, match.index));
    html += `<a href="${escapeHtml(url)}" data-print-url="${escapeHtml(printableUrl(url))}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
    last = match.index + whole.length;
  }
  return html + escapeHtml(text.slice(last));
}

// What /resume.json publishes: the same data, with inline links spelled out
// as "text (url)" so tools importing it get plain text.
export function publishedResume(resume) {
  return {
    ...resume,
    work: resume.work?.map((position) =>
      position.summary
        ? { ...position, summary: position.summary.replace(INLINE_LINK, "$1 ($2)") }
        : position,
    ),
  };
}
