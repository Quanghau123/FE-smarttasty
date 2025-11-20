import { NextIntlClientProvider, hasLocale } from "next-intl";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Roboto } from "next/font/google";
import LayoutClient from "@/app/LayoutClient";
import BrokerPortalLayout from "@/components/layouts/LayoutWrapper";
import "../globals.css";

const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      className={`${roboto.variable} font-sans`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider locale={locale}>
          <LayoutClient>
            <BrokerPortalLayout>{children}</BrokerPortalLayout>
          </LayoutClient>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// Thiết lập tiêu đề (title) tab trình duyệt mặc định và mẫu hiển thị cho toàn bộ nhánh [locale]
// - default: tiêu đề mặc định khi trang không đặt title riêng
// - template: khi trang đặt title, sẽ chèn vào mẫu này. Ví dụ: "Trang chủ | SmartTasty"
export const metadata: Metadata = {
  title: {
    default: "SmartTasty",
    template: "SmartTasty/%s",
  },
};
