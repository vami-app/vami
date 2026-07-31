import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

export default async function PublicLayout({ children }) {
  await dbConnect();
  
  // Fetch categories for Navbar and Footer
  const categoriesDocs = await Category.find().sort({ name: 1 }).lean();
  
  // Serialize for client components
  const categories = categoriesDocs.map(c => ({
    _id: c._id.toString(),
    name: c.name,
    slug: c.slug,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar categories={categories} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer categories={categories} />
    </div>
  );
}
