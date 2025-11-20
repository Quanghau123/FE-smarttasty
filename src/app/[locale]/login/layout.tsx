
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nested layouts must not render <html> or <body> — the top-level
  // `app/[locale]/layout.tsx` already provides those. Return children
  // directly to avoid hydration mismatches.
  return <>{children}</>;
}
