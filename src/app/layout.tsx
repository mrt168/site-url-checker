import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Site URL Checkers',
  description: 'URLからサイトマップを取得し、全ページの一覧と内容をまとめるWebアプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  )
}
