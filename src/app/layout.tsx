import type { Metadata } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/auth/SessionProvider";

// Site-wide body typeface. To change it, swap the loader here; everything
// else reads the semantic --font-body variable.
const bodyFont = Roboto({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TahOak Park Collective",
  description: "Business directory for Tahoe Park, Oak Park, Elmhurst, Colonial Park, and Curtis Park neighborhoods",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font variables must live on <html>: Tailwind resolves --font-sans on :root,
    // so variables scoped to <body> are undefined there and fall back to system fonts.
    <html suppressHydrationWarning className={`${bodyFont.variable} ${geistMono.variable}`}>
      <body className="antialiased flex flex-col min-h-screen">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
