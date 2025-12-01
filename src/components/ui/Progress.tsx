'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  showLabel?: boolean
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, showLabel = false, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <div className="relative h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-sage-500 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <div className="mt-1 text-sm text-stone-500 text-right">{Math.round(percentage)}%</div>
        )}
      </div>
    )
  }
)

Progress.displayName = 'Progress'

export { Progress }
