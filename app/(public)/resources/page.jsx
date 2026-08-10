import Link from 'next/link';
import { getPublishedResources } from '@/services/resource.service';
import { SAMPLE_RESOURCES } from '@/config/marketing-content';

export const metadata = {
  title: 'Resources & Downloads',
  description:
    'Product catalogues, technical data sheets and company profile downloads from Radhey Metal Alloys LLP.',
};

export default async function ResourcesPage() {
  let resources = [];
  try {
    resources = await getPublishedResources();
  } catch {
    resources = [];
  }
  const docs = resources.length > 0 ? resources : SAMPLE_RESOURCES;

  return (
    <div className="layout-main">
      <section className="py-16 sm:py-24 w-full bg-surface border-b border-border-subtle">
        <div className="max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <p className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
            Technical Resources
          </p>
          <h1 className="mt-4 font-headline font-light text-text-primary text-4xl sm:text-5xl">
            Catalogues & Data Sheets
          </h1>
          <p className="mt-6 text-lg text-text-muted font-light max-w-2xl">
            Download catalogues, technical data sheets and company profile materials for engineering and procurement teams.
          </p>

          <ul className="mt-12 divide-y divide-border-subtle border border-border-subtle rounded-[var(--inner-radius)] overflow-hidden">
            {docs.map((r) => (
              <li
                key={r._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-surface"
              >
                <div>
                  <p className="text-xs uppercase tracking-wider text-text-muted">{r.type}</p>
                  <h2 className="text-lg font-medium text-text-primary mt-1">{r.title}</h2>
                  {r.description ? (
                    <p className="text-sm text-text-muted mt-2 font-light">{r.description}</p>
                  ) : null}
                </div>
                {r.fileUrl ? (
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex px-5 py-2.5 rounded-lg border border-border-base text-sm font-semibold uppercase tracking-wider hover:bg-surface-muted"
                    data-track="file_download"
                  >
                    Download
                  </a>
                ) : null}
              </li>
            ))}
          </ul>

          <Link
            href="/contact"
            className="inline-flex mt-10 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wider"
          >
            Request a Quote
          </Link>
        </div>
      </section>
    </div>
  );
}
