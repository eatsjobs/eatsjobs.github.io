import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.addFilter("readableDate", (dateObj) =>
    new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "long", day: "numeric" }).format(
      dateObj,
    ),
  );
  eleventyConfig.addFilter("htmlDateString", (dateObj) => dateObj.toISOString().slice(0, 10));
  // ~220 wpm is a common adult average for non-fiction prose. Code blocks
  // count as words too, which suits a technical blog - code isn't read
  // faster than prose.
  eleventyConfig.addFilter("readingTime", (html) => {
    const words = String(html)
      .replace(/<[^>]*>/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  });

  eleventyConfig.addPassthroughCopy("css");
  // Explicit .js globs (rather than the whole js/ directory) so *.test.mjs
  // files never end up published on the live site.
  eleventyConfig.addPassthroughCopy("js/*.js");
  eleventyConfig.addPassthroughCopy("js/components/*.js");
  eleventyConfig.addPassthroughCopy("favicon.svg");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("favicon-16x16.png");
  eleventyConfig.addPassthroughCopy("favicon-32x32.png");
  eleventyConfig.addPassthroughCopy("apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy("icon-192.png");
  eleventyConfig.addPassthroughCopy("icon-512.png");
  eleventyConfig.addPassthroughCopy("og-image.png");
  eleventyConfig.addPassthroughCopy("site.webmanifest");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
    },
    templateFormats: ["html", "md", "njk"],
  };
}
