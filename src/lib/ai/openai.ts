export interface GPTResponse {
  urls: string[]
  confidence: number
}

const OPENAI_API_URL = 'https://api.openai.com/v1/responses'

function buildSitemapPrompt(targetUrl: string): string {
  return `あなたはWebサイトの構造分析の専門家です。
以下のURLのWebサイトについて、考えられる全てのページURLを網羅的にリストアップしてください。

対象URL: ${targetUrl}

## 分析手順
1. まず、このURLのドメインを確認し、一般的なWebサイト構造を推測してください
2. robots.txtやsitemap.xmlが存在する可能性のあるパスを考慮してください
3. 一般的なページ構成（トップ、会社概要、サービス、ブログ、お問い合わせ等）を考慮してください
4. 各ページの子ページやサブセクションも含めてください

## 出力形式
以下のJSON形式で出力してください:
{
  "urls": ["https://example.com/page1", "https://example.com/page2", ...],
  "confidence": 0.8
}

## 注意事項
- 同一ドメイン内のURLのみを出力してください
- URLは完全な形式（https://から始まる）で出力してください
- 重複を避けてください
- 実際に存在する可能性の高いURLのみを出力してください`
}

export async function analyzeWithGPT(targetUrl: string): Promise<GPTResponse> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.1',
      input: buildSitemapPrompt(targetUrl),
      reasoning: { effort: 'high' },
      text: { verbosity: 'medium' },
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'sitemap_response',
          schema: {
            type: 'object',
            properties: {
              urls: {
                type: 'array',
                items: { type: 'string' },
              },
              confidence: { type: 'number' },
            },
            required: ['urls', 'confidence'],
          },
        },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()

  // Parse the response
  const outputText = data.output_text || data.output?.[0]?.content?.[0]?.text

  if (!outputText) {
    throw new Error('No response from OpenAI API')
  }

  try {
    const parsed = JSON.parse(outputText) as GPTResponse
    return {
      urls: Array.isArray(parsed.urls) ? parsed.urls : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    }
  } catch {
    throw new Error('Failed to parse GPT response')
  }
}
