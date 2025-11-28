import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";

/**
 * Layout for authentication pages.
 * Uses the same public navbar and footer as public pages.
 */
export default function AuthLayout({
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

