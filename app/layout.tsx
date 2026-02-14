import type { Metadata } from "next"
import { Bai_Jamjuree, Space_Grotesk } from "next/font/google"
import "./globals.css"

import { AppProviders } from "@/components/providers/app-providers"

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
})

const bodyFont = Bai_Jamjuree({
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Dedicora",
  description: "Dedicora - focus, timing, and productivity flow",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} min-h-screen antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
