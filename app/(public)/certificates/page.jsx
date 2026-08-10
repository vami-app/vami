import Link from 'next/link';
import { getPublishedCertificates } from '@/services/certificate.service';

export const metadata = {
  title: 'Certificates & Quality Documentation',
  description:
    'Download verified quality documentation from Radhey Metal Alloys LLP. Certificates appear here only after verification.',
};

export default async function CertificatesPage() {
  let certificates = [];
  try {
    certificates = await getPublishedCertificates();
  } catch {
    certificates = [];
  }

  return (
    <div className="layout-main bg-surface">
      <div className="max-w-[var(--max-width-layout)] mx-auto py-16 px-[var(--gap)] sm:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
            Quality Assurance
          </p>
          <h1 className="mt-4 font-headline font-light text-text-primary text-4xl sm:text-5xl">
            Certificates &amp; Documentation
          </h1>
          <p className="mt-5 text-lg text-text-muted font-light leading-relaxed">
            Verified certificates and quality documents are published here after review.
            Unverified claims are never shown.
          </p>
        </div>

        {certificates.length === 0 ? (
          <div className="mt-16 max-w-xl mx-auto text-center border border-border-subtle rounded-[var(--inner-radius)] bg-surface-muted px-8 py-12">
            <p className="text-text-muted font-light leading-relaxed">
              No verified certificates are published yet. Contact our team for sample MTCs,
              inspection reports, or laboratory documentation related to your enquiry.
            </p>
            <Link
              href="/contact"
              className="inline-flex mt-8 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Request a Quote
            </Link>
          </div>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="bg-surface-muted rounded-[var(--inner-radius)] px-6 py-8 border border-border-subtle text-center"
              >
                <h2 className="text-lg font-medium text-text-primary tracking-tight">
                  {cert.title}
                </h2>
                {cert.description ? (
                  <p className="mt-4 text-base text-text-muted font-light">{cert.description}</p>
                ) : null}
                {cert.issuedBy ? (
                  <p className="mt-3 text-sm text-text-muted">Issued by {cert.issuedBy}</p>
                ) : null}
                {cert.fileUrl ? (
                  <div className="mt-6">
                    <a
                      href={cert.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-medium text-text-primary underline underline-offset-4 hover:opacity-80"
                      data-track="file_download"
                      data-resource={cert.title}
                    >
                      Download PDF →
                    </a>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
