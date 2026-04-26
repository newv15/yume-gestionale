import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Yume Gestionale',
  description: 'Gestionale ordini Yume Fumetteria',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}