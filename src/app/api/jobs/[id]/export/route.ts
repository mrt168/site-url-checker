import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exportToCsv, exportToJson } from '@/lib/utils/export'
import type { UrlResult } from '@/types'

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
 * GET /api/jobs/[id]/export
 * Export results for a specific job
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'

    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json(
        { error: '無効なフォーマットです。csv または json を指定してください' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Check if job exists and is completed
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, target_url')
      .eq('id', id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'ジョブが見つかりません' },
        { status: 404 }
      )
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: 'ジョブがまだ完了していません' },
        { status: 400 }
      )
    }

    // Get results
    const { data: results, error: resultsError } = await supabase
      .from('url_results')
      .select('*')
      .eq('job_id', id)
      .order('url', { ascending: true })

    if (resultsError) {
      console.error('Failed to fetch results:', resultsError)
      return NextResponse.json(
        { error: '結果の取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'エクスポートする結果がありません' },
        { status: 404 }
      )
    }

    // Convert to UrlResult type
    const urlResults: UrlResult[] = results.map((r) => ({
      id: r.id,
      job_id: r.job_id,
      url: r.url,
      title: r.title,
      description: r.description,
      status_code: r.status_code,
      is_valid: r.is_valid,
      source: r.source,
      error_message: r.error_message,
      created_at: r.created_at,
    }))

    // Generate export content
    const content = format === 'csv' ? exportToCsv(urlResults) : exportToJson(urlResults)
    const mimeType = format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json'
    const extension = format === 'csv' ? 'csv' : 'json'

    // Generate filename from target URL
    const domain = new URL(job.target_url).hostname.replace(/\./g, '_')
    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `sitemap-results_${domain}_${timestamp}.${extension}`

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
