import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VaultDrop — Encrypted File Sharing',
  description: 'Share files securely with end-to-end encryption. Password protect, set expiry, share safely.',
  keywords: ['file sharing', 'encrypted', 'secure', 'privacy', 'end-to-end encryption'],
  openGraph: {
    title: 'VaultDrop',
    description: 'Share files securely with end-to-end encryption.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
