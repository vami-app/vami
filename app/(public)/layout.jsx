import { StandardLayoutTemplate } from "@/components/templates/standard-layout";
import { getAllCategories } from "@/modules/categories";

export default async function PublicLayout({ children }) {
  let categories = [];
  try {
    const categoriesDocs = await getAllCategories();
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
    <StandardLayoutTemplate categories={categories}>
      {children}
    </StandardLayoutTemplate>
  );
}
