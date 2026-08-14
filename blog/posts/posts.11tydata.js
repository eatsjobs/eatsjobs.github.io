// Directory data for blog/posts/ - replaces posts.json so drafts can be
// computed rather than hand-maintained in two places.
export default {
  layout: "layouts/post.njk",
  tags: ["posts"],

  eleventyComputed: {
    // `draft: true` in a post's front matter keeps it out of the build
    // completely: permalink false means no page is written, and excluding it
    // from collections keeps it off the blog index and out of feed.xml and
    // sitemap.xml, which are both generated from collections. Nothing to
    // remember to undo at publish time beyond deleting the one line.
    //
    // To preview drafts locally: BUILD_DRAFTS=1 npm start
    permalink(data) {
      if (data.draft && !process.env.BUILD_DRAFTS) {
        return false;
      }
      return `/blog/${data.page.fileSlug}/`;
    },

    eleventyExcludeFromCollections(data) {
      if (data.draft && !process.env.BUILD_DRAFTS) {
        return true;
      }
      return data.eleventyExcludeFromCollections;
    },
  },
};
