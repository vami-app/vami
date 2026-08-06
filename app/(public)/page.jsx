import { HomePageFeature } from "@/features/public/home-page";
import { getFeaturedProducts } from "@/modules/products";
import { getAllCategories } from "@/modules/categories";

export default async function HomePage() {
  let featuredProducts = [];
  let categories = [];

  try {
    const featuredDocs = await getFeaturedProducts(4);
    featuredProducts = featuredDocs.map((p) => ({
      ...p,
      _id: p._id.toString(),
      category: p.category
        ? { ...p.category, _id: p.category._id.toString() }
        : null,
    }));

    const categoryDocs = await getAllCategories(6);
    categories = categoryDocs.map((c) => ({
      ...c,
      _id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      description: c.description,
    }));
  } catch (error) {
    console.error(
      "Database connection failed on HomePage render:",
      error.message,
    );
  }

  return (
    <HomePageFeature 
      featuredProducts={featuredProducts} 
      categories={categories} 
    />
  );
}

