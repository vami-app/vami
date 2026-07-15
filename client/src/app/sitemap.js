export default async function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fallback = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${apiUrl}/api/posts/sitemap-data`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      return fallback;
    }

    const envelope = await res.json();
    if (!envelope || !envelope.success || !envelope.data || !Array.isArray(envelope.data.posts)) {
      return fallback;
    }

    const posts = envelope.data.posts;
    const entries = [...fallback];
    const uniqueAuthors = new Set();

    posts.forEach((post) => {
      entries.push({
        url: `${siteUrl}/p/${post.slug}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: "weekly",
        priority: 0.8,
      });

      if (post.authorUsername && post.authorUsername !== "deleted") {
        uniqueAuthors.add(post.authorUsername);
      }
    });

    uniqueAuthors.forEach((username) => {
      entries.push({
        url: `${siteUrl}/@${username}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.5,
      });
    });

    return entries;
  } catch (err) {
    return fallback;
  }
}
