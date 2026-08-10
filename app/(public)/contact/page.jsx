import { getSiteSettings } from '@/services/settings.service';
import ContactClient from './ContactClient';

export const metadata = {
  title: 'Request a Quote / Contact',
  description:
    'Request a quote for copper, brass, phosphor bronze products and custom castings from Radhey Metal Alloys LLP.',
};

export default async function ContactPage() {
  let settings = {};
  try {
    settings = (await getSiteSettings()) || {};
  } catch {
    settings = {};
  }
  return <ContactClient settings={settings} />;
}
