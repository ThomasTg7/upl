import { BRAND } from "@/domain/brand";
import type { Metadata } from "next";
import { anton, barlow, barlowCondensed, montserrat } from "./fonts";
import "./globals.css";
import "./upl-public.css";
import "./upl-admin.css";
import "./upl-motion.css";

export const metadata: Metadata = {
  title: BRAND.name,
  description: BRAND.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-UY"
      className={`${anton.variable} ${barlowCondensed.variable} ${barlow.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
