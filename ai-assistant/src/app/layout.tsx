import "@fontsource-variable/vazirmatn";
import "@/styles/globals.css";

import { type Metadata } from "next";
import Script from "next/script";

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
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            try {
              const theme = localStorage.getItem('theme') || 'system';
              const root = document.documentElement;
              
              if (theme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                root.classList.add(systemTheme);
              } else {
                root.classList.add(theme);
              }
            } catch (e) {}
          `}
        </Script>
      </head>
      <body className="font-vazirmatn">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
