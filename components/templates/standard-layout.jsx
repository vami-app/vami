import { Navbar } from "@/components/organisms/navbar";
import { Footer } from "@/components/organisms/footer";
import { FloatingContactButton } from "@/components/organisms/floating-contact";

/**
 * Standard layout template for public pages
 */
export function StandardLayoutTemplate({ children, categories = [] }) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-surface relative">
      <Navbar categories={categories} />
      <main className="flex-grow">{children}</main>
      <Footer categories={categories} />
      <FloatingContactButton />
    </div>
  );
}
