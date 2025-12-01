'use client'

import { useState, useEffect, useCallback } from 'react'
import { UrlInput, ProgressIndicator, ResultsTable } from '@/components'
import type { Job, UrlResult, JobStatus } from '@/types'

type AppState = 'idle' | 'loading' | 'analyzing' | 'completed' | 'error'

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [results, setResults] = useState<UrlResult[]>([])
  const [error, setError] = useState<string | null>(null)

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) throw new Error('ジョブの取得に失敗しました')

      const data = await response.json()
      setCurrentJob(data.job)

      if (data.job.status === 'completed') {
        // Fetch results
        const resultsResponse = await fetch(`/api/jobs/${jobId}/results`)
        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json()
          setResults(resultsData.results)
        }
        setAppState('completed')
      } else if (data.job.status === 'failed') {
        setError(data.job.error_message || '分析に失敗しました')
        setAppState('error')
      }
    } catch (err) {
      console.error('Error polling job status:', err)
    }
  }, [])

  // Start polling when analyzing
  useEffect(() => {
    if (appState !== 'analyzing' || !currentJob) return

    const interval = setInterval(() => {
      pollJobStatus(currentJob.id)
    }, 2000)

    return () => clearInterval(interval)
  }, [appState, currentJob, pollJobStatus])

  const handleSubmit = async (url: string) => {
    setAppState('loading')
    setError(null)
    setResults([])

    try {
      // Create job
      const createResponse = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!createResponse.ok) {
        const data = await createResponse.json()
        throw new Error(data.error || 'ジョブの作成に失敗しました')
      }

      const { job } = await createResponse.json()
      setCurrentJob(job)
      setAppState('analyzing')

      // Start analysis
      const analyzeResponse = await fetch(`/api/jobs/${job.id}/analyze`, {
        method: 'POST',
      })

      if (!analyzeResponse.ok) {
        const data = await analyzeResponse.json()
        throw new Error(data.error || '分析の開始に失敗しました')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました')
      setAppState('error')
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    if (!currentJob) return

    try {
      const response = await fetch(`/api/jobs/${currentJob.id}/export?format=${format}`)
      if (!response.ok) throw new Error('エクスポートに失敗しました')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sitemap-results.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert('エクスポートに失敗しました')
    }
  }

  const handleReset = () => {
    setAppState('idle')
    setCurrentJob(null)
    setResults([])
    setError(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-stone-800 mb-4">Site URL Checker</h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            URLを入力すると、AIがサイトマップを分析し、全ページのURLと内容を一覧化します。
            Gemini 3.0とGPT-5.1を使用して、漏れのないURL抽出を実現します。
          </p>
        </header>

        {/* Main content */}
        <div className="space-y-8">
          {/* URL Input - always visible but disabled when analyzing */}
          {(appState === 'idle' || appState === 'error') && (
            <UrlInput onSubmit={handleSubmit} loading={appState === 'loading'} />
          )}

          {/* Progress indicator */}
          {(appState === 'loading' || appState === 'analyzing') && currentJob && (
            <ProgressIndicator
              status={currentJob.status as JobStatus}
              progress={currentJob.progress}
            />
          )}

          {/* Error message */}
          {appState === 'error' && error && (
            <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-500 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="font-medium text-red-800">エラーが発生しました</h3>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {appState === 'completed' && results.length > 0 && (
            <>
              <div className="flex justify-center">
                <button
                  onClick={handleReset}
                  className="text-sage-600 hover:text-sage-700 font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  新しいURLを分析
                </button>
              </div>
              <ResultsTable results={results} onExport={handleExport} />
            </>
          )}

          {/* No results */}
          {appState === 'completed' && results.length === 0 && (
            <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
              <svg
                className="w-12 h-12 text-amber-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="font-medium text-amber-800 mb-2">URLが見つかりませんでした</h3>
              <p className="text-sm text-amber-600">
                指定されたサイトからURLを抽出できませんでした。
                サイトマップが存在しないか、アクセスが制限されている可能性があります。
              </p>
              <button
                onClick={handleReset}
                className="mt-4 text-amber-700 hover:text-amber-800 font-medium"
              >
                別のURLを試す
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-stone-400">
          <p>Powered by Gemini 3.0 Pro & GPT-5.1</p>
        </footer>
      </div>
    </main>
  )
}
