import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PhenoFarm - B2B Cannabis Marketplace',
  description: 'Connect growers and dispensaries for wholesale cannabis transactions',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
