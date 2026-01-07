import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Creep Damage Assessment - Knar Global",
  description:
    "Industrial equipment creep analysis configuration interface powered by Knar Global engineering solutions",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
  metadataBase: new URL("https://wint01.knarglobal.com"),
  openGraph: {
    title: "Creep Damage Assessment - Knar Global",
    description: "Industrial equipment creep analysis configuration interface",
    siteName: "Knar Global",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
