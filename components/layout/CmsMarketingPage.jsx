import Link from 'next/link';
import { getPublishedPageContent } from '@/services/page-content.service';
import { Button } from '@/components/ui/button';

/**
 * Shared CMS-backed marketing page shell.
 * Falls back to approved roadmap content when CMS entries are empty.
 */
export default async function CmsMarketingPage({
  contentKey,
  fallbackTitle,
  fallbackSubtitle,
  fallbackBody = '',
  fallbackSections = [],
  ctaHref = '/contact',
  ctaLabel = 'Request a Quote',
}) {
  let content = null;
  try {
    content = await getPublishedPageContent(contentKey);
  } catch {
    content = null;
  }

  const title = content?.title || fallbackTitle;
  const subtitle = content?.subtitle || fallbackSubtitle;
  const body = content?.body || fallbackBody;
  const cmsSections = (content?.sections || [])
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  // Prefer approved roadmap sections when provided so gated/empty CMS never blanks the page.
  const sections =
    fallbackSections.length > 0
      ? fallbackSections
      : cmsSections;

  return (
    <div className="layout-main">
      <section className="py-16 sm:py-24 w-full border-b border-border-subtle bg-surface">
        <div className="max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <p className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
            Radhey Metal Alloys LLP
          </p>
          <h1 className="mt-4 font-headline font-light text-text-primary text-4xl sm:text-5xl lg:text-6xl max-w-4xl">
            {title}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-text-muted font-light leading-relaxed max-w-3xl">
            {subtitle}
          </p>
          {body ? (
            <div className="mt-8 prose prose-neutral dark:prose-invert max-w-3xl font-light text-text-muted whitespace-pre-line">
              {body}
            </div>
          ) : null}

          {sections.length > 0 ? (
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sections.map((section, idx) => (
                <div
                  key={`${section.title}-${idx}`}
                  className="border border-border-subtle rounded-[var(--inner-radius)] bg-surface-muted p-8"
                >
                  {section.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={section.imageUrl}
                      alt=""
                      className="w-full h-40 object-cover rounded-lg mb-6 border border-border-subtle"
                    />
                  ) : null}
                  <h2 className="text-xl font-medium text-text-primary">{section.title}</h2>
                  <p className="mt-3 text-text-muted font-light leading-relaxed">
                    {section.description}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-12">
            <Button asChild className="px-8 py-4 text-sm shadow-none h-auto">
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
