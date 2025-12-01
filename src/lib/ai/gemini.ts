export interface GeminiResponse {
  urls: string[]
  confidence: number
}

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent'

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

export async function analyzeWithGemini(targetUrl: string): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: buildSitemapPrompt(targetUrl),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
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
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${error}`)
  }

  const data = await response.json()

  // Parse the response
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!textContent) {
    throw new Error('No response from Gemini API')
  }

  try {
    const parsed = JSON.parse(textContent) as GeminiResponse
    return {
      urls: Array.isArray(parsed.urls) ? parsed.urls : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    }
  } catch {
    throw new Error('Failed to parse Gemini response')
  }
}
