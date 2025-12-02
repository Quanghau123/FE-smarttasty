"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import ScrollToTop from "@/components/layouts/ScrollToTop";
import { ScrollProvider } from "@/components/commons/contexts/ScrollContext";

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const authRoutes = [
    "/login",
    "/register",
    "/register-business",
    "/ErrorPages/notfound",
  ];
  const hideHeaderFooter = authRoutes.some((route) => pathname.includes(route));

  return (
    <ScrollProvider>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {!hideHeaderFooter && <Header />}
        <main style={{ flex: "1 0 auto" }}>{children}</main>
        {!hideHeaderFooter && <ScrollToTop />}
        {!hideHeaderFooter && <Footer />}
      </div>
    </ScrollProvider>
  );
}
