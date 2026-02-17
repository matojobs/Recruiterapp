import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import LayoutClient from './layout-client'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Recruiter App - Sourcing Tracker',
  description: 'Web-based recruitment sourcing tracker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  )
}
