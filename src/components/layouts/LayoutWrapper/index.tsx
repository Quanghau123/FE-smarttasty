"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const authRoutes = ["/login", "/register"];
  const hideHeaderFooter = authRoutes.some((route) => pathname.includes(route));

  return (
    <>
      {!hideHeaderFooter && <Header />}
      <main>{children}</main>
      {!hideHeaderFooter && <Footer />}
    </>
  );
}
