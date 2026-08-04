/**
 * Categories Module — Public API
 */
export {
  getAllCategories,
  getCategoryBySlug,
  getCategoryByIdUncached,
  createCategory,
  updateCategory,
  deleteCategory,
} from './category.service';

export { CategorySchema } from './category.schema';
