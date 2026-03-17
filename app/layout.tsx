import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S2 Bike | Meta Ads Dashboard",
  description: "Dashboard de performance das campanhas Meta Ads — S2 Bike",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
