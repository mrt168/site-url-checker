import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/jobs/[id]
 * Get a specific job by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = getSupabaseClient()

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'ジョブが見つかりません' },
          { status: 404 }
        )
      }
      console.error('Failed to fetch job:', error)
      return NextResponse.json(
        { error: 'ジョブの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
