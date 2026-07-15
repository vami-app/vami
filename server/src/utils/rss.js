"use strict";

const { Feed } = require("feed");

/**
 * Build an RSS feed string.
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.id
 * @param {string} params.link
 * @param {Array<Object>} params.posts
 * @returns {string} Feed XML string
 */
function buildFeed({ title, id, link, posts }) {
  const feed = new Feed({
    title,
    id,
    link,
    description: "A quiet place to read and write stories.",
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    updated: new Date(),
    generator: "Inkwell RSS Feed Generator",
  });

  posts.forEach((p) => {
    const authorName = p.author ? p.author.name : "Anonymous";
    
    feed.addItem({
      title: p.title,
      id: `${link}/p/${p.slug}`,
      link: `${link}/p/${p.slug}`,
      description: p.subtitle || "",
      content: p.contentHtml || "",
      date: p.publishedAt || p.createdAt || new Date(),
      author: [
        {
          name: authorName,
          link: p.author ? `${link}/@${p.author.username}` : undefined,
        },
      ],
    });
  });

  return feed.rss2();
}

module.exports = { buildFeed };
