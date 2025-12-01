import type { MetaInfo } from '@/types'

const TIMEOUT_MS = 10000 // 10 seconds

/**
 * Extract title and description meta tags from a URL
 */
export async function extractMeta(url: string): Promise<MetaInfo> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SiteURLChecker/1.0)',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return { title: null, description: null }
    }

    const html = await response.text()
    return parseMetaFromHtml(html)
  } catch {
    clearTimeout(timeoutId)
    return { title: null, description: null }
  }
}

/**
 * Parse meta information from HTML string
 */
export function parseMetaFromHtml(html: string): MetaInfo {
  const title = extractTitle(html)
  const description = extractDescription(html)

  return { title, description }
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string | null {
  // Try to match <title>...</title>
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  if (titleMatch && titleMatch[1]) {
    return decodeHtmlEntities(titleMatch[1].trim())
  }

  // Try og:title
  const ogTitleMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
  )
  if (ogTitleMatch && ogTitleMatch[1]) {
    return decodeHtmlEntities(ogTitleMatch[1].trim())
  }

  // Try twitter:title
  const twitterTitleMatch = html.match(
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i
  )
  if (twitterTitleMatch && twitterTitleMatch[1]) {
    return decodeHtmlEntities(twitterTitleMatch[1].trim())
  }

  return null
}

/**
 * Extract description from HTML
 */
function extractDescription(html: string): string | null {
  // Try meta description
  const descMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
  )
  if (descMatch && descMatch[1]) {
    return decodeHtmlEntities(descMatch[1].trim())
  }

  // Try alternate attribute order
  const descMatchAlt = html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i
  )
  if (descMatchAlt && descMatchAlt[1]) {
    return decodeHtmlEntities(descMatchAlt[1].trim())
  }

  // Try og:description
  const ogDescMatch = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
  )
  if (ogDescMatch && ogDescMatch[1]) {
    return decodeHtmlEntities(ogDescMatch[1].trim())
  }

  // Try twitter:description
  const twitterDescMatch = html.match(
    /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i
  )
  if (twitterDescMatch && twitterDescMatch[1]) {
    return decodeHtmlEntities(twitterDescMatch[1].trim())
  }

  return null
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  }

  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity)
}

/**
 * Extract meta information from multiple URLs in parallel
 */
export async function extractMetaFromUrls(
  urls: string[],
  concurrency = 3,
  onProgress?: (extracted: number, total: number) => void
): Promise<Map<string, MetaInfo>> {
  const results = new Map<string, MetaInfo>()
  const queue = [...urls]
  let extracted = 0

  async function processUrl(): Promise<void> {
    while (queue.length > 0) {
      const url = queue.shift()
      if (!url) break

      const meta = await extractMeta(url)
      results.set(url, meta)
      extracted++

      if (onProgress) {
        onProgress(extracted, urls.length)
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
