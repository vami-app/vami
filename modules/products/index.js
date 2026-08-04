/**
 * Products Module — Public API
 *
 * RULE: Only imports from this barrel file are permitted in other modules or app/ routes.
 */
export {
  getAllPublishedProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getProductBySlug,
  getProductById,
  getProductsList,
  getProductByIdUncached,
  createProduct,
  updateProduct,
  deleteProduct,
} from './product.service';

export { ProductSchema } from './product.schema';
