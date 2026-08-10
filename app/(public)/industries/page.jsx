import CmsMarketingPage from '@/components/layout/CmsMarketingPage';

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
      fallbackSubtitle="Application pages publish only for industries RMA actually serves."
      fallbackBody={`Candidate industries (verify before publish):\n• Electrical & Power\n• Automotive\n• General Engineering\n• Pumps & Valves\n• Bearings & Bushes\n• Industrial Machinery`}
    />
  );
}
