import { getAllPublishedProducts } from '@/modules/products';
import { ProductsPageFeature } from '@/features/public/products/products-page';

export const metadata = {
  title: 'All Products | Smalloys',
  description: 'Browse our complete catalog of premium industrial materials, alloys, and composites.',
};

export default async function AllProductsPage() {
  let productsData = { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
  try {
    // Fetch initial page with a limit of 12 for the grid
    productsData = await getAllPublishedProducts({ limit: 12 });
  } catch (error) {
    console.error('Database connection failed on Products page render:', error.message);
  }

  return <ProductsPageFeature productsData={productsData} />;
}
