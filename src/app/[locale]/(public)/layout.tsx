import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";

/**
 * Layout for public-facing pages.
 * Includes the public navbar and footer.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNavbar />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </>
  );
}

