'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui'
import type { UrlResult, UrlSource } from '@/types'

interface ResultsTableProps {
  results: UrlResult[]
  onExport: (format: 'csv' | 'json') => void
}

const sourceLabels: Record<UrlSource, string> = {
  gemini: 'Gemini',
  gpt: 'GPT',
  sitemap: 'Sitemap',
  merged: '両方',
}

const sourceBadgeVariants: Record<UrlSource, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  gemini: 'info',
  gpt: 'warning',
  sitemap: 'success',
  merged: 'default',
}

type FilterType = 'all' | 'valid' | 'invalid'
type SortField = 'url' | 'status' | 'source'

export function ResultsTable({ results, onExport }: ResultsTableProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortField, setSortField] = useState<SortField>('url')
  const [sortAsc, setSortAsc] = useState(true)

  // Filter results
  const filteredResults = results.filter((result) => {
    if (filter === 'valid') return result.is_valid
    if (filter === 'invalid') return !result.is_valid
    return true
  })

  // Sort results
  const sortedResults = [...filteredResults].sort((a, b) => {
    let comparison = 0
    if (sortField === 'url') {
      comparison = a.url.localeCompare(b.url)
    } else if (sortField === 'status') {
      comparison = (a.status_code || 0) - (b.status_code || 0)
    } else if (sortField === 'source') {
      comparison = a.source.localeCompare(b.source)
    }
    return sortAsc ? comparison : -comparison
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return (
      <svg
        className={`w-4 h-4 inline-block ml-1 transition-transform ${sortAsc ? '' : 'rotate-180'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    )
  }

  // Statistics
  const stats = {
    total: results.length,
    valid: results.filter((r) => r.is_valid).length,
    invalid: results.filter((r) => !r.is_valid).length,
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>検出されたURL</CardTitle>
            <div className="flex gap-4 mt-2 text-sm text-stone-500">
              <span>全て: {stats.total}</span>
              <span className="text-sage-600">有効: {stats.valid}</span>
              <span className="text-red-600">無効: {stats.invalid}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onExport('csv')}>
              CSVエクスポート
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onExport('json')}>
              JSONエクスポート
            </Button>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 mt-4">
          {(['all', 'valid', 'invalid'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === f
                  ? 'bg-sage-100 text-sage-700'
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              {f === 'all' ? '全て' : f === 'valid' ? '有効のみ' : '無効のみ'}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200">
                <th
                  className="text-left py-3 px-4 font-medium text-stone-600 cursor-pointer hover:text-stone-900"
                  onClick={() => handleSort('url')}
                >
                  URL <SortIcon field="url" />
                </th>
                <th className="text-left py-3 px-4 font-medium text-stone-600">タイトル</th>
                <th
                  className="text-center py-3 px-4 font-medium text-stone-600 cursor-pointer hover:text-stone-900"
                  onClick={() => handleSort('status')}
                >
                  ステータス <SortIcon field="status" />
                </th>
                <th
                  className="text-center py-3 px-4 font-medium text-stone-600 cursor-pointer hover:text-stone-900"
                  onClick={() => handleSort('source')}
                >
                  ソース <SortIcon field="source" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result, index) => (
                <tr
                  key={result.url}
                  className={`border-b border-stone-100 hover:bg-stone-50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-700 hover:underline break-all"
                    >
                      {result.url}
                    </a>
                    {result.description && (
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                        {result.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-stone-800">{result.title || '-'}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {result.is_valid ? (
                      <Badge variant="success">{result.status_code || 'OK'}</Badge>
                    ) : (
                      <Badge variant="error">
                        {result.status_code || result.error_message || 'Error'}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={sourceBadgeVariants[result.source]}>
                      {sourceLabels[result.source]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedResults.length === 0 && (
            <div className="text-center py-8 text-stone-500">
              該当するURLがありません
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
