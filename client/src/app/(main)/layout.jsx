import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
