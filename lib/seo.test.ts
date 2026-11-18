import assert from "node:assert/strict";
import { join } from "node:path";
import { before, test } from "node:test";
import Eleventy from "@11ty/eleventy";

// Renders the whole site in memory (nothing is written to _site) and checks
// the machine-readable output search engines and AI assistants read.
// Runs as TypeScript through Node's built-in type stripping (Node 22.18+),
// so it can only use erasable syntax: annotations, no enums or namespaces.
type RenderedPage = { url: string; content: string };
type JsonLdNode = { "@type": string; "@id"?: string; mainEntity?: { "@id": string } };

const root = join(import.meta.dirname, "..");
let pages: RenderedPage[];

before(async () => {
  const eleventy = new Eleventy(root, join(root, "_site"), {
    quietMode: true,
    configPath: join(root, "eleventy.config.js"),
  });
  pages = await eleventy.toJSON();
});

function page(url: string): RenderedPage {
  const found = pages.find((p) => p.url === url);
  assert.ok(found, `${url} is rendered`);
  return found;
}

function jsonLdTypes(html: string): JsonLdNode[] {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, "page has JSON-LD");
  return JSON.parse(match[1])["@graph"];
}

test("the homepage is a schema.org ProfilePage about the site's Person", () => {
  const graph = jsonLdTypes(page("/").content);
  const profile = graph.find((node) => node["@type"] === "ProfilePage");
  assert.ok(profile, "homepage graph has a ProfilePage node");
  assert.equal(profile.mainEntity?.["@id"], "https://eatsjobs.github.io/#person");
  assert.ok(graph.some((node) => node["@id"] === "https://eatsjobs.github.io/#person"));
});

test("only the homepage is a ProfilePage", () => {
  for (const url of ["/blog/", "/blog/ciao/"]) {
    const types = jsonLdTypes(page(url).content).map((node) => node["@type"]);
    assert.ok(!types.includes("ProfilePage"), `${url} is not a ProfilePage`);
  }
});

test("/llms.txt introduces the site and links its pages for AI assistants", () => {
  const llms = page("/llms.txt").content;
  assert.match(llms, /^# Pasquale Mangialavori\n\n> .+/);
  for (const url of [
    "https://eatsjobs.github.io/",
    "https://eatsjobs.github.io/blog/",
    "https://eatsjobs.github.io/blog/ciao/",
    "https://eatsjobs.github.io/resume.json",
    "https://eatsjobs.github.io/feed.xml",
  ]) {
    assert.ok(llms.includes(`](${url})`), `links ${url}`);
  }
});

test("/llms.txt is plain Markdown, not HTML-escaped text", () => {
  const llms = page("/llms.txt").content;
  assert.ok(llms.includes("master's degree"));
  assert.doesNotMatch(llms, /&(#\d+|amp|lt|gt|quot);/);
});

test("/llms.txt leaves draft posts out", () => {
  assert.ok(!page("/llms.txt").content.includes("animation-timeline"));
});
