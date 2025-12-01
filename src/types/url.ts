export type UrlSource = 'gemini' | 'gpt' | 'sitemap' | 'merged'

export interface UrlResult {
  id: string
  job_id: string
  url: string
  title: string | null
  description: string | null
  status_code: number | null
  is_valid: boolean | null
  source: UrlSource
  error_message: string | null
  created_at: string
}

export interface UrlCheckResult {
  url: string
  statusCode: number
  isValid: boolean
  errorMessage?: string
}

export interface MetaInfo {
  title: string | null
  description: string | null
}
