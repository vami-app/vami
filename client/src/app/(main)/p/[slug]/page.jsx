import Link from "next/link";
import StoryPageClient from "./StoryPageClient";

/**
 * Generate metadata for story page (Next.js 15 Metadata API)
 */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${apiUrl}/api/posts/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { robots: { index: false } };
    }
    const envelope = await res.json();
    if (!envelope.success || !envelope.data || !envelope.data.post) {
      return { robots: { index: false } };
    }

    const post = envelope.data.post;

    if (post.status !== "published" || !post.indexable) {
      return { robots: { index: false } };
    }

    const title = post.seo?.metaTitle || post.title;
    const rawContent = post.contentHtml ? post.contentHtml.replace(/<[^>]*>/g, " ") : "";
    const description = post.seo?.metaDescription || rawContent.trim().slice(0, 160);
    const canonicalUrl = post.seo?.canonicalUrl || `${siteUrl}/p/${post.slug}`;
    const coverImage = post.coverImage
      ? (post.coverImage.startsWith("http://") || post.coverImage.startsWith("https://")
        ? post.coverImage
        : `${apiUrl}${post.coverImage}`)
      : "";

    return {
      title: `${title} — Inkwell`,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: "article",
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt,
        authors: post.author ? [post.author.name] : [],
        images: coverImage ? [{ url: coverImage }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: coverImage ? [coverImage] : [],
      },
      robots: { index: true, follow: true },
    };
  } catch (err) {
    console.error("Metadata generation error:", err);
    return { robots: { index: false } };
  }
}

/**
 * Server component for the story reading page.
 */
export default async function StoryPage({ params }) {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let post = null;
  let notFound = false;

  try {
    const res = await fetch(`${apiUrl}/api/posts/${slug}`, {
      cache: "no-store",
    });
    if (res.status === 404) {
      notFound = true;
    } else {
      const envelope = await res.json();
      if (envelope.success) {
        post = envelope.data.post;
      } else {
        notFound = true;
      }
    }
  } catch (err) {
    console.error("Error loading story:", err);
    notFound = true;
  }

  if (notFound || !post) {
    return (
      <div className="mx-auto max-w-reading px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-bold">Story not found</h1>
        <p className="mt-2 text-ink-soft">It may have been removed or never published.</p>
        <Link href="/" className="mt-6 inline-block text-accent-600 hover:underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  const title = post.title;
  const canonicalUrl = post.seo?.canonicalUrl || `${siteUrl}/p/${post.slug}`;
  const authorName = post.author ? post.author.name : "Anonymous";
  const authorUsername = post.author ? post.author.username : "deleted";

  const coverImageVal = post.coverImage
    ? (post.coverImage.startsWith("http://") || post.coverImage.startsWith("https://")
      ? post.coverImage
      : `${apiUrl}${post.coverImage}`)
    : null;

  // Build JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: post.subtitle || "",
    image: coverImageVal ? [coverImageVal] : [],
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: authorName,
      url: `${siteUrl}/@${authorUsername}`,
    },
    mainEntityOfPage: canonicalUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StoryPageClient initialPost={post} />
    </>
  );
}
