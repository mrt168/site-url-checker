'use client'

import { useState } from 'react'
import { Button, Input, Card, CardContent } from '@/components/ui'
import { validateUrl } from '@/lib/validators/url'

interface UrlInputProps {
  onSubmit: (url: string) => void
  loading?: boolean
}

export function UrlInput({ onSubmit, loading = false }: UrlInputProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validation = validateUrl(url)
    if (!validation.success) {
      setError(validation.error)
      return
    }

    onSubmit(validation.url)
  }

  return (
    <Card variant="elevated" className="max-w-2xl mx-auto">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              id="url-input"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (error) setError('')
              }}
              error={error}
              label="サイトURL"
              disabled={loading}
            />
            <p className="mt-2 text-sm text-stone-500">
              分析したいウェブサイトのURLを入力してください
            </p>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {loading ? '分析中...' : 'サイトマップを分析'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
