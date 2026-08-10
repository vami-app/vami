import CmsMarketingPage from '@/components/layout/CmsMarketingPage';
import { CAPABILITIES_SECTIONS } from '@/config/marketing-content';

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
      fallbackSubtitle="From raw material selection through packing and dispatch."
      fallbackBody="Radhey Metal Alloys LLP manufactures and supplies precision non-ferrous mill products and custom castings from Kalol, Gujarat — copper, brass, phosphor bronze and related alloys."
      fallbackSections={CAPABILITIES_SECTIONS}
    />
  );
}
