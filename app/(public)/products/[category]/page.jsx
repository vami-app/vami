import { getCategoryBySlug } from '@/modules/categories';
import { getProductsByCategory } from '@/modules/products';
import { CategoryPageFeature } from '@/features/public/products/category-page';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { category: categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  
  if (!category) return { title: 'Category Not Found' };
  
  return {
    title: category.seoTitle || `${category.name} | Smalloys`,
    description: category.seoDescription || category.description || `Browse our selection of ${category.name}`,
  };
}

export default async function CategoryPage({ params }) {
  const { category: categorySlug } = await params;
  
  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const products = await getProductsByCategory(category._id);

  return <CategoryPageFeature category={category} products={products} />;
}
