'use client'

import { Progress, Card, CardContent } from '@/components/ui'
import type { JobStatus } from '@/types'

interface ProgressIndicatorProps {
  status: JobStatus
  progress: number
}

const statusLabels: Record<JobStatus, string> = {
  pending: '準備中',
  analyzing: 'AIで分析中',
  checking: 'URLの有効性を確認中',
  fetching_meta: 'メタ情報を抽出中',
  completed: '完了',
  failed: 'エラー',
}

const statusDescriptions: Record<JobStatus, string> = {
  pending: 'ジョブを開始しています...',
  analyzing: 'Gemini 3.0とGPT-5.1でURLを抽出中',
  checking: '各URLにアクセスして有効性を確認中',
  fetching_meta: '有効なURLからタイトルと説明を取得中',
  completed: '全ての処理が完了しました',
  failed: 'エラーが発生しました',
}

export function ProgressIndicator({ status, progress }: ProgressIndicatorProps) {
  const isError = status === 'failed'
  const isComplete = status === 'completed'

  return (
    <Card
      variant="bordered"
      className={`max-w-2xl mx-auto ${isError ? 'border-red-200' : isComplete ? 'border-sage-200' : ''}`}
    >
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3
                className={`font-semibold ${isError ? 'text-red-700' : isComplete ? 'text-sage-700' : 'text-stone-800'}`}
              >
                {statusLabels[status]}
              </h3>
              <p className="text-sm text-stone-500">{statusDescriptions[status]}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isComplete && !isError && (
                <div className="animate-pulse">
                  <div className="w-2 h-2 bg-sage-500 rounded-full" />
                </div>
              )}
              {isComplete && (
                <svg
                  className="w-6 h-6 text-sage-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {isError && (
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
          </div>

          <Progress value={progress} showLabel />

          {/* Progress steps */}
          <div className="flex justify-between text-xs text-stone-400">
            <span className={progress >= 20 ? 'text-sage-600' : ''}>サイトマップ</span>
            <span className={progress >= 40 ? 'text-sage-600' : ''}>AI分析</span>
            <span className={progress >= 70 ? 'text-sage-600' : ''}>URL確認</span>
            <span className={progress >= 100 ? 'text-sage-600' : ''}>完了</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
