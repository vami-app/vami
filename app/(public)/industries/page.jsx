import CmsMarketingPage from '@/components/layout/CmsMarketingPage';
import { INDUSTRIES_SECTIONS } from '@/config/marketing-content';

export const metadata = {
  title: 'Industries & Applications',
  description:
    'Non-ferrous products for electrical, automotive, pumps & valves, bearings, and general engineering.',
};

export default function IndustriesPage() {
  return (
    <CmsMarketingPage
      contentKey="industries"
      fallbackTitle="Industries & Applications"
      fallbackSubtitle="Non-ferrous products for the sectors we actively serve."
      fallbackBody="Application-focused supply for electrical, automotive, engineering and industrial buyers."
      fallbackSections={INDUSTRIES_SECTIONS}
    />
  );
}
