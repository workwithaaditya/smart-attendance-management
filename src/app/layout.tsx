import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Smart Attendance Predictor',
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
        {children}
      </body>
    </html>
  )
}