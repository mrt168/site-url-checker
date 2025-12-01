import { normalizeUrl, isSameDomain } from '@/lib/validators/url'
import type { UrlSource } from '@/types'

export interface MergedUrl {
  url: string
  sources: UrlSource[]
}

/**
 * Merge URLs from multiple sources, removing duplicates
 */
export function mergeUrls(
  geminiUrls: string[],
  gptUrls: string[],
  sitemapUrls: string[] = [],
  baseDomain: string
): MergedUrl[] {
  const urlMap = new Map<string, Set<UrlSource>>()

  // Add Gemini URLs
  for (const url of geminiUrls) {
    const normalized = normalizeUrl(url)
    if (isSameDomain(normalized, `https://${baseDomain}`)) {
      const sources = urlMap.get(normalized) || new Set()
      sources.add('gemini')
      urlMap.set(normalized, sources)
    }
  }

  // Add GPT URLs
  for (const url of gptUrls) {
    const normalized = normalizeUrl(url)
    if (isSameDomain(normalized, `https://${baseDomain}`)) {
      const sources = urlMap.get(normalized) || new Set()
      sources.add('gpt')
      urlMap.set(normalized, sources)
    }
  }

  // Add sitemap URLs
  for (const url of sitemapUrls) {
    const normalized = normalizeUrl(url)
    if (isSameDomain(normalized, `https://${baseDomain}`)) {
      const sources = urlMap.get(normalized) || new Set()
      sources.add('sitemap')
      urlMap.set(normalized, sources)
    }
  }

  // Convert to array and sort
  const merged: MergedUrl[] = []
  for (const [url, sources] of urlMap) {
    merged.push({
      url,
      sources: Array.from(sources),
    })
  }

  // Sort by URL for consistent ordering
  merged.sort((a, b) => a.url.localeCompare(b.url))

  return merged
}

/**
 * Get the primary source for a merged URL
 */
export function getPrimarySource(sources: UrlSource[]): UrlSource {
  // Priority: sitemap > merged (both AI) > gemini > gpt
  if (sources.includes('sitemap')) return 'sitemap'
  if (sources.includes('gemini') && sources.includes('gpt')) return 'merged'
  if (sources.includes('gemini')) return 'gemini'
  return 'gpt'
}

/**
 * Filter URLs that appear in multiple sources
 */
export function getMultiSourceUrls(mergedUrls: MergedUrl[]): MergedUrl[] {
  return mergedUrls.filter((item) => item.sources.length > 1)
}

/**
 * Filter URLs that appear in only one source
 */
export function getSingleSourceUrls(mergedUrls: MergedUrl[]): MergedUrl[] {
  return mergedUrls.filter((item) => item.sources.length === 1)
}
