import CmsMarketingPage from '@/components/layout/CmsMarketingPage';

export const metadata = {
  title: 'Manufacturing Capabilities',
  description:
    'Non-ferrous melting, casting, rolling, finishing and inspection capabilities at Radhey Metal Alloys LLP.',
};

export default function CapabilitiesPage() {
  return (
    <CmsMarketingPage
      contentKey="capabilities"
      fallbackTitle="Manufacturing Capabilities"
      fallbackSubtitle="From raw material selection through packing and dispatch — verified process details publish here after review."
      fallbackBody={`Recommended process presentation (confirm with RMA before publishing details):\n\nRaw Material Selection → Melting & Alloying → Casting → Rolling / Forming → Machining / Finishing → Quality Inspection → Packing & Dispatch.`}
    />
  );
}
