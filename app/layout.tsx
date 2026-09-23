import type { Metadata, Viewport } from 'next'
import { Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const hankenGrotesk = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken-grotesk', display: 'swap' })
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PhenoFarm - B2B Cannabis Marketplace',
  description: 'Connect licensed growers and dispensaries for wholesale requests, fulfillment coordination, and direct settlement',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PhenoFarm',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#070b09' },
    { media: '(prefers-color-scheme: light)', color: '#070b09' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${hankenGrotesk.variable} ${ibmPlexMono.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
