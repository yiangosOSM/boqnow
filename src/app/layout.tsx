// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BOQNOW — AI Bill of Quantities Generator',
  description: 'Αυτόματη δημιουργία Bill of Quantities από αρχιτεκτονικά σχέδια. ΜΕΔΣΚ compliant. Για εργολάβους Κύπρου & Ελλάδας.',
  keywords: 'BOQ, Bill of Quantities, ΜΕΔΣΚ, εργολάβοι, Κύπρος, Ελλάδα, τεχνικές προσφορές',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="el">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
