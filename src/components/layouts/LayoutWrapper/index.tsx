"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import ScrollToTop from "@/components/layouts/ScrollToTop";

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
    <>
      {!hideHeaderFooter && <Header />}
      <main>{children}</main>
      {!hideHeaderFooter && <ScrollToTop />}
      {!hideHeaderFooter && <Footer />}
    </>
  );
}
