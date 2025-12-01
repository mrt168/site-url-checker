import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Site URL Checker - AIでサイトマップを分析',
  description: 'URLを入力すると、AIがサイトマップを分析し、全ページのURLと内容を一覧化します。Gemini 3.0とGPT-5.1を使用して、漏れのないURL抽出を実現します。',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
