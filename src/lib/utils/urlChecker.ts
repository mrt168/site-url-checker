import type { UrlCheckResult } from '@/types'

const TIMEOUT_MS = 10000 // 10 seconds

/**
 * Check if a URL is valid and accessible
 */
export async function checkUrl(url: string): Promise<UrlCheckResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeoutId)

    return {
      url,
      statusCode: response.status,
      isValid: response.ok,
      errorMessage: response.ok ? undefined : `HTTP ${response.status}`,
    }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          url,
          statusCode: 0,
          isValid: false,
          errorMessage: 'Request timeout',
        }
      }
      return {
        url,
        statusCode: 0,
        isValid: false,
        errorMessage: error.message,
      }
    }

    return {
      url,
      statusCode: 0,
      isValid: false,
      errorMessage: 'Unknown error',
    }
  }
}

/**
 * Check multiple URLs in parallel with concurrency limit
 */
export async function checkUrls(
  urls: string[],
  concurrency = 5,
  onProgress?: (checked: number, total: number) => void
): Promise<UrlCheckResult[]> {
  const results: UrlCheckResult[] = []
  const queue = [...urls]
  let checked = 0

  async function processUrl(): Promise<void> {
    while (queue.length > 0) {
      const url = queue.shift()
      if (!url) break

      const result = await checkUrl(url)
      results.push(result)
      checked++

      if (onProgress) {
        onProgress(checked, urls.length)
      }
    }
  }

  // Create concurrent workers
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () =>
    processUrl()
  )

  await Promise.all(workers)

  return results
}
