export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type JobStatus =
  | 'pending'
  | 'analyzing'
  | 'checking'
  | 'fetching_meta'
  | 'completed'
  | 'failed'

export type UrlSource = 'gemini' | 'gpt' | 'sitemap' | 'merged'

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string
          input_url: string
          status: JobStatus
          error_message: string | null
          total_urls: number
          checked_urls: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          input_url: string
          status?: JobStatus
          error_message?: string | null
          total_urls?: number
          checked_urls?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          input_url?: string
          status?: JobStatus
          error_message?: string | null
          total_urls?: number
          checked_urls?: number
          created_at?: string
          updated_at?: string
        }
      }
      urls: {
        Row: {
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
        Insert: {
          id?: string
          job_id: string
          url: string
          title?: string | null
          description?: string | null
          status_code?: number | null
          is_valid?: boolean | null
          source: UrlSource
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          url?: string
          title?: string | null
          description?: string | null
          status_code?: number | null
          is_valid?: boolean | null
          source?: UrlSource
          error_message?: string | null
          created_at?: string
        }
      }
    }
  }
}
