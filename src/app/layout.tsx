import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Smart Attendance Management',
  description: 'Track and predict your attendance percentage with smart planning tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} dark:bg-slate-900`} suppressHydrationWarning>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}