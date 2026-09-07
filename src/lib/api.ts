import type { Lang, TranslateRequest, TranslateResponse } from '../../api/_lib/types'

export type { Lang }

export async function requestTranslation(
  text: string,
  source: Lang,
): Promise<TranslateResponse['translations']> {
  const body: TranslateRequest = { text, source }

  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? `요청 실패 (HTTP ${res.status})`)
  }

  const data = (await res.json()) as TranslateResponse
  return data.translations
}
