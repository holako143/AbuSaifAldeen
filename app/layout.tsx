import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AlgorithmProvider } from "@/hooks/use-algorithm"
import { SecurityProvider } from "@/hooks/use-security"
import { EncoderStateProvider } from "@/hooks/use-encoder-state"
import { Header } from "@/components/layout/header"

export const metadata: Metadata = {
  title: "شفريشن | Shiffration",
  description: "تشفير وفك تشفير النصوص باستخدام الايموجي",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>😅</text></svg>"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="orange"
          disableTransitionOnChange
        >
          <AlgorithmProvider>
            <SecurityProvider>
              <EncoderStateProvider>
                <div className="relative flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                </div>
              </EncoderStateProvider>
            </SecurityProvider>
          </AlgorithmProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
