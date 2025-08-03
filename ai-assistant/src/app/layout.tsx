import "@fontsource-variable/vazirmatn";
import "@/styles/globals.css";

import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "دستیار هوشمند فارسی",
  description: "دستیار هوشمند فارسی با قابلیت چت، ترجمه و تولید تصویر",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-vazirmatn">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
