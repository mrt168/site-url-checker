export type JobStatus =
  | 'pending'
  | 'analyzing'
  | 'checking'
  | 'fetching_meta'
  | 'completed'
  | 'failed'

export interface Job {
  id: string
  input_url: string
  status: JobStatus
  error_message: string | null
  total_urls: number
  checked_urls: number
  created_at: string
  updated_at: string
}

export interface CreateJobRequest {
  url: string
}

export interface CreateJobResponse {
  id: string
  input_url: string
  status: JobStatus
  created_at: string
}
