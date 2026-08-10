import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAllCategories } from "@/services/category.service";
import FloatingContactButton from "@/components/ui/FloatingContactButton";
import { getSiteSettings } from "@/services/settings.service";

export default async function PublicLayout({ children }) {
  let categories = [];
  let settings = {};
  try {
    const [categoriesDocs, siteSettings] = await Promise.all([
      getAllCategories(),
      getSiteSettings(),
    ]);

    categories = (categoriesDocs || []).map((c) => ({
      _id: String(c._id || ''),
      name: c.name,
      slug: c.slug,
    }));
    settings = siteSettings || {};
  } catch (error) {
    console.error(
      "Database connection skipped or failed during render:",
      error.message,
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface relative">
      <Navbar categories={categories} />
      <main className="flex-grow">{children}</main>
      <Footer categories={categories} settings={settings} />
      <FloatingContactButton
        email={settings.contactEmail || undefined}
        whatsappNumber={settings.whatsappNumber || undefined}
      />
    </div>
  );
}
