import { getProductBySlug } from "@/modules/products";
import { ProductDetailPageFeature } from "@/features/public/products/product-detail-page";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { category: categorySlug, slug: productSlug } = await params;
  
  const data = await getProductBySlug(categorySlug, productSlug);
  if (!data) return { title: "Product Not Found" };
  
  const { product } = data;

  return {
    title: product.seoTitle || `${product.name} | Smalloys`,
    description:
      product.seoDescription ||
      product.shortDescription ||
      `Buy ${product.name} at Smalloys.`,
    openGraph: {
      images:
        product.images && product.images.length > 0 ? [product.images[0]] : [],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { category: categorySlug, slug: productSlug } = await params;
  
  const data = await getProductBySlug(categorySlug, productSlug);
  if (!data) notFound();
  
  const { product, category } = data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images || [],
    description: product.shortDescription || product.seoDescription,
    sku: product._id.toString(),
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "USD",
      price: "0.00", // Request quote paradigm
    },
  };

  return (
    <ProductDetailPageFeature
      product={product}
      category={category}
      jsonLd={jsonLd}
    />
  );
}
