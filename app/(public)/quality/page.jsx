import CmsMarketingPage from '@/components/layout/CmsMarketingPage';
import Link from 'next/link';
import { getPublishedCertificates } from '@/services/certificate.service';
import { QUALITY_SECTIONS, SAMPLE_CERTIFICATES } from '@/config/marketing-content';

export const metadata = {
  title: 'Quality & Testing',
  description:
    'Chemical analysis, mechanical testing, dimensional inspection, traceability and documentation from Radhey Metal Alloys LLP.',
};

export default async function QualityPage() {
  let certificates = [];
  try {
    certificates = await getPublishedCertificates();
  } catch {
    certificates = [];
  }
  const docs = certificates.length > 0 ? certificates : SAMPLE_CERTIFICATES;

  return (
    <>
      <CmsMarketingPage
        contentKey="quality"
        fallbackTitle="Quality Assurance & Testing"
        fallbackSubtitle="Documentation and testing options for industrial buyers. Laboratory reports are distinct from laboratory accreditation."
        fallbackBody="We publish only tests and documentation RMA can substantiate."
        fallbackSections={QUALITY_SECTIONS}
        ctaHref="/certificates"
        ctaLabel="View Certificates"
      />
      <section className="pb-20">
        <div className="max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <h2 className="font-headline text-3xl text-text-primary mb-6">Documentation</h2>
          <ul className="space-y-3">
            {docs.map((c) => (
              <li key={c._id}>
                <Link href="/certificates" className="text-text-primary underline underline-offset-4">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
