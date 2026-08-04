/**
 * Products Module — Service re-export
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
} from '@/services/product.service';
