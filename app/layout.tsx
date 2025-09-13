import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { PwaDiagnostics } from "@/components/pwa-diagnostics";
import "./globals.css";

export const metadata: Metadata = {
  title: "شفريشن",
  description: "تطبيق تشفير احترافي",
  manifest: "/manifest.json",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 12h.01'/><path d='M10 16v-4a2 2 0 1 1 4 0v4'/><path d='M14 12a2 2 0 1 0-4 0'/><path d='M6.2 12.4a6.5 6.5 0 1 1 11.6 0'/><path d='M18.8 12.4a6.5 6.5 0 1 0-11.6 0'/><path d='M12 2a10 10 0 1 0 10 10'/></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          themes={['light', 'dark', 'system', 'theme-dusk', 'theme-oceanic', 'theme-mirage', 'theme-sakura', 'theme-matrix']}
        >
          {children}
          <SonnerToaster richColors />
          <PwaDiagnostics />
        </ThemeProvider>
      </body>
    </html>
  );
}
