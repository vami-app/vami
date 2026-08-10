import { getLandingBySlug } from '@/services/landing.service';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const page = await getLandingBySlug(slug);
    if (!page) return { title: 'Not found' };
    return {
      title: page.seoTitle || page.title,
      description: page.seoDescription || page.h1 || page.title,
    };
  } catch {
    return { title: 'Not found' };
  }
}

export default async function ApplicationLandingPage({ params }) {
  const { slug } = await params;
  let page = null;
  try {
    page = await getLandingBySlug(slug);
  } catch {
    page = null;
  }
  if (!page) notFound();

  return (
    <div className="layout-main">
      <article className="max-w-3xl mx-auto px-[var(--gap)] py-16 sm:py-24">
        {page.geo ? (
          <p className="text-xs uppercase tracking-wider text-text-muted">{page.geo}</p>
        ) : null}
        <h1 className="mt-2 font-headline text-4xl sm:text-5xl text-text-primary font-light">
          {page.h1 || page.title}
        </h1>
        <div className="mt-8 whitespace-pre-line text-text-muted font-light leading-relaxed">
          {page.body}
        </div>
        <Link
          href="/contact"
          className="inline-flex mt-10 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wider"
        >
          Request a Quote
        </Link>
      </article>
    </div>
  );
}
