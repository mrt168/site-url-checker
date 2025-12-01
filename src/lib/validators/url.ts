import { z } from 'zod'

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .min(1, 'URLを入力してください')
  .url('有効なURLを入力してください')
  .refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    'URLはhttp://またはhttps://で始まる必要があります'
  )

/**
 * Validate a URL string
 */
export function validateUrl(url: string): { success: true; url: string } | { success: false; error: string } {
  const result = urlSchema.safeParse(url)

  if (result.success) {
    return { success: true, url: result.data }
  }

  return {
    success: false,
    error: result.error.errors[0]?.message || 'Invalid URL',
  }
}

/**
 * Normalize a URL (remove trailing slash, etc.)
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Remove trailing slash from pathname (except for root)
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1)
    }
    // Remove default ports
    if (
      (parsed.protocol === 'http:' && parsed.port === '80') ||
      (parsed.protocol === 'https:' && parsed.port === '443')
    ) {
      parsed.port = ''
    }
    return parsed.toString()
  } catch {
    return url
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    return null
  }
}

/**
 * Check if two URLs are from the same domain
 */
export function isSameDomain(url1: string, url2: string): boolean {
  const domain1 = extractDomain(url1)
  const domain2 = extractDomain(url2)
  return domain1 !== null && domain1 === domain2
}
