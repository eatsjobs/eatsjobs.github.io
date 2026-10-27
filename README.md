# eatsjobs.github.io

Personal portfolio site for Pasquale Mangialavori — Senior Frontend Engineer at Scandit, based in Barcelona.

Live at https://eatsjobs.github.io

Plain HTML/CSS/vanilla JS, no bundler. The homepage and `/blog/` are built with
[Eleventy](https://www.11ty.dev/) (`npm run build`) into `_site/`, which a GitHub
Actions workflow deploys to GitHub Pages on every push to `main`. `npm start` runs
a local dev server with live reload.

The CV content (experience, projects, education, profile links) lives in
[`_data/resume.json`](_data/resume.json), in the [JSON Resume](https://jsonresume.org)
format. The homepage renders from it, it's published as `/resume.json`, and it
prints as the CV (`css/print.css`): the "Save as PDF" button in its footer opens
the print dialog.

Design notes: [`docs/superpowers/specs/2026-08-11-eatsjobs-github-io-design.md`](docs/superpowers/specs/2026-08-11-eatsjobs-github-io-design.md)

# Tracking 

https://cloud.umami.is
