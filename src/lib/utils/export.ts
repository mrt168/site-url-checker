import type { UrlResult } from '@/types'

/**
 * Export URL results to CSV format
 */
export function exportToCsv(results: UrlResult[]): string {
  const headers = ['URL', 'タイトル', 'ディスクリプション', 'ステータス', '有効', 'ソース', 'エラー']

  const rows = results.map((result) => [
    escapeCSV(result.url),
    escapeCSV(result.title || ''),
    escapeCSV(result.description || ''),
    result.status_code?.toString() || '',
    result.is_valid ? '有効' : '無効',
    result.source,
    escapeCSV(result.error_message || ''),
  ])

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  // Add BOM for Excel compatibility with Japanese characters
  return '\uFEFF' + csvContent
}

/**
 * Escape a value for CSV
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Export URL results to JSON format
 */
export function exportToJson(results: UrlResult[]): string {
  const exportData = results.map((result) => ({
    url: result.url,
    title: result.title,
    description: result.description,
    statusCode: result.status_code,
    isValid: result.is_valid,
    source: result.source,
    errorMessage: result.error_message,
  }))

  return JSON.stringify(exportData, null, 2)
}

/**
 * Download a file in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download results as CSV
 */
export function downloadCsv(results: UrlResult[], filename = 'sitemap-results.csv'): void {
  const csv = exportToCsv(results)
  downloadFile(csv, filename, 'text/csv;charset=utf-8')
}

/**
 * Download results as JSON
 */
export function downloadJson(results: UrlResult[], filename = 'sitemap-results.json'): void {
  const json = exportToJson(results)
  downloadFile(json, filename, 'application/json')
}
