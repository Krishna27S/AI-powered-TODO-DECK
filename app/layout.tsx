import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI TO-DO DECK ',
  description: 'Created by Krishna',
  generator: 'K',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
