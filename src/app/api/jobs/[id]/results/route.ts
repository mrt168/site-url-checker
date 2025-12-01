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
 * GET /api/jobs/[id]/results
 * Get results for a specific job
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    // Query parameters for filtering
    const filterValid = searchParams.get('valid')
    const filterSource = searchParams.get('source')
    const sortBy = searchParams.get('sort') || 'url'
    const sortOrder = searchParams.get('order') || 'asc'

    const supabase = getSupabaseClient()

    // First check if job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'ジョブが見つかりません' },
        { status: 404 }
      )
    }

    // Build query for results
    let query = supabase
      .from('url_results')
      .select('*')
      .eq('job_id', id)

    // Apply filters
    if (filterValid !== null) {
      query = query.eq('is_valid', filterValid === 'true')
    }

    if (filterSource) {
      query = query.eq('source', filterSource)
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    if (sortBy === 'status_code') {
      query = query.order('status_code', { ascending, nullsFirst: false })
    } else if (sortBy === 'source') {
      query = query.order('source', { ascending })
    } else {
      query = query.order('url', { ascending })
    }

    const { data: results, error: resultsError } = await query

    if (resultsError) {
      console.error('Failed to fetch results:', resultsError)
      return NextResponse.json(
        { error: '結果の取得に失敗しました' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const stats = {
      total: results?.length || 0,
      valid: results?.filter((r) => r.is_valid).length || 0,
      invalid: results?.filter((r) => !r.is_valid).length || 0,
      by_source: {
        gemini: results?.filter((r) => r.source === 'gemini').length || 0,
        gpt: results?.filter((r) => r.source === 'gpt').length || 0,
        sitemap: results?.filter((r) => r.source === 'sitemap').length || 0,
        merged: results?.filter((r) => r.source === 'merged').length || 0,
      },
    }

    return NextResponse.json({
      job_id: id,
      job_status: job.status,
      results: results || [],
      stats,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
