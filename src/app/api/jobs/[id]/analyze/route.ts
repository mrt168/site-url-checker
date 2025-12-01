import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeWithGemini } from '@/lib/ai/gemini'
import { analyzeWithGPT } from '@/lib/ai/openai'
import { mergeUrls, getPrimarySource } from '@/lib/utils/urlMerger'
import { checkUrls } from '@/lib/utils/urlChecker'
import { extractMetaFromUrls } from '@/lib/utils/metaExtractor'
import { extractDomain } from '@/lib/validators/url'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface RouteParams {
  params: Promise<{ id: string }>
}

async function updateJobStatus(
  supabase: ReturnType<typeof getSupabaseClient>,
  jobId: string,
  status: string,
  errorMessage: string | null = null,
  progress?: number
) {
  const updateData: Record<string, unknown> = { status }
  if (errorMessage !== null) {
    updateData.error_message = errorMessage
  }
  if (progress !== undefined) {
    updateData.progress = progress
  }

  await supabase.from('jobs').update(updateData).eq('id', jobId)
}

/**
 * POST /api/jobs/[id]/analyze
 * Start analyzing a job
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = getSupabaseClient()

  try {
    // Get job
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'ジョブが見つかりません' },
        { status: 404 }
      )
    }

    if (job.status !== 'pending') {
      return NextResponse.json(
        { error: 'このジョブは既に処理中または完了しています' },
        { status: 400 }
      )
    }

    const targetUrl = job.target_url
    const baseDomain = extractDomain(targetUrl)

    if (!baseDomain) {
      await updateJobStatus(supabase, id, 'failed', '無効なURLです')
      return NextResponse.json(
        { error: '無効なURLです' },
        { status: 400 }
      )
    }

    // Update status: analyzing
    await updateJobStatus(supabase, id, 'analyzing', null, 20)

    // Analyze with both AI services in parallel
    let geminiUrls: string[] = []
    let gptUrls: string[] = []

    try {
      const [geminiResult, gptResult] = await Promise.allSettled([
        analyzeWithGemini(targetUrl),
        analyzeWithGPT(targetUrl),
      ])

      if (geminiResult.status === 'fulfilled') {
        geminiUrls = geminiResult.value.urls
      }
      if (gptResult.status === 'fulfilled') {
        gptUrls = gptResult.value.urls
      }
    } catch (aiError) {
      console.error('AI analysis error:', aiError)
    }

    if (geminiUrls.length === 0 && gptUrls.length === 0) {
      await updateJobStatus(supabase, id, 'completed', null, 100)
      return NextResponse.json({
        job_id: id,
        message: 'URLが見つかりませんでした',
        urls_found: 0,
      })
    }

    // Merge URLs from both sources
    const mergedUrls = mergeUrls(geminiUrls, gptUrls, [], baseDomain)

    // Update status: checking URLs
    await updateJobStatus(supabase, id, 'checking', null, 40)

    // Check URL validity
    const urlList = mergedUrls.map((m) => m.url)
    const checkResults = await checkUrls(urlList, 5)

    // Update status: extracting meta
    await updateJobStatus(supabase, id, 'fetching_meta', null, 70)

    // Extract meta information from valid URLs
    const validUrls = checkResults.filter((r) => r.isValid).map((r) => r.url)
    const metaResults = await extractMetaFromUrls(validUrls, 3)

    // Save results to database
    const urlResults = mergedUrls.map((merged) => {
      const checkResult = checkResults.find((r) => r.url === merged.url)
      const meta = metaResults.get(merged.url)
      const primarySource = getPrimarySource(merged.sources)

      return {
        job_id: id,
        url: merged.url,
        title: meta?.title || null,
        description: meta?.description || null,
        status_code: checkResult?.statusCode || null,
        is_valid: checkResult?.isValid || false,
        source: primarySource,
        error_message: checkResult?.errorMessage || null,
      }
    })

    const { error: insertError } = await supabase
      .from('url_results')
      .insert(urlResults)

    if (insertError) {
      console.error('Failed to save results:', insertError)
      await updateJobStatus(supabase, id, 'failed', '結果の保存に失敗しました')
      return NextResponse.json(
        { error: '結果の保存に失敗しました' },
        { status: 500 }
      )
    }

    // Update status: completed
    await updateJobStatus(supabase, id, 'completed', null, 100)

    return NextResponse.json({
      job_id: id,
      message: '分析が完了しました',
      urls_found: mergedUrls.length,
      valid_urls: validUrls.length,
      invalid_urls: mergedUrls.length - validUrls.length,
    })
  } catch (error) {
    console.error('Unexpected error during analysis:', error)
    await updateJobStatus(supabase, id, 'failed', '予期しないエラーが発生しました')
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
