// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import MockBanner from '@/components/dev/MockBanner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const isMock = process.env.MOCK_AUTH === 'true'

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
  const body = (
    <>
      <MockBanner />
      {children}
    </>
  )

  if (isMock) {
    return (
      <html lang="el">
        <body className={inter.className}>{body}</body>
      </html>
    )
  }

  return (
    <ClerkProvider>
      <html lang="el">
        <body className={inter.className}>{body}</body>
      </html>
    </ClerkProvider>
  )
}
