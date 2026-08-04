import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAllCategories } from "@/services/category.service";

export default async function PublicLayout({ children }) {
  let categories = [];
  try {
    const categoriesDocs = await getAllCategories();

    // Serialize for client components
    categories = (categoriesDocs || []).map((c) => ({
      _id: String(c._id || ''),
      name: c.name,
      slug: c.slug,
    }));
  } catch (error) {
    console.error(
      "Database connection skipped or failed during render:",
      error.message,
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar categories={categories} />
      <main className="flex-grow">{children}</main>
      <Footer categories={categories} />
    </div>
  );
}
