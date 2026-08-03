import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";

export default async function PublicLayout({ children }) {
  let categories = [];
  try {
    await dbConnect();
    // Fetch categories for Navbar and Footer
    const categoriesDocs = await Category.find().sort({ name: 1 }).lean();

    // Serialize for client components
    categories = categoriesDocs.map((c) => ({
      _id: c._id.toString(),
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
