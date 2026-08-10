import CmsMarketingPage from '@/components/layout/CmsMarketingPage';
import Link from 'next/link';
import { getPublishedCertificates } from '@/services/certificate.service';

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

  return (
    <>
      <CmsMarketingPage
        contentKey="quality"
        fallbackTitle="Quality Assurance & Testing"
        fallbackSubtitle="Publish only tests and wording RMA can substantiate. Distinguish NABL laboratory reports from NABL accreditation."
        fallbackBody={`Typical quality pillars (confirm before publish):\n• Chemical Analysis\n• Mechanical Testing\n• Dimensional Inspection\n• Visual Inspection\n• Material Traceability\n• Third-Party Testing\n• Material Test Certificates\n• Inspection Reports`}
        ctaHref="/certificates"
        ctaLabel="View Certificates"
      />
      {certificates.length > 0 ? (
        <section className="pb-20">
          <div className="max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
            <h2 className="font-headline text-3xl text-text-primary mb-6">Published documentation</h2>
            <ul className="space-y-3">
              {certificates.map((c) => (
                <li key={c._id}>
                  <Link href="/certificates" className="text-text-primary underline underline-offset-4">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
