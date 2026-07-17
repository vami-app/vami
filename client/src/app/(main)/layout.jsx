import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VerificationBanner from "@/components/layout/VerificationBanner";

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <VerificationBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
