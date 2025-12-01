import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateUrl } from '@/lib/validators/url'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * POST /api/jobs
 * Create a new URL checking job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    // Validate URL
    const validation = validateUrl(url)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Create job
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        target_url: validation.url,
        status: 'pending',
        progress: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create job:', error)
      return NextResponse.json(
        { error: 'ジョブの作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/jobs
 * List all jobs
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient()

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to fetch jobs:', error)
      return NextResponse.json(
        { error: 'ジョブの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
