import type {
  InterpretRequest,
  InterpretResponse,
  Lang,
  TranslateRequest,
  TranslateResponse,
} from '../../api/_lib/types'
import { blobToBase64 } from './audio'
import { getPassword, invalidatePassword } from './auth'

export type { InterpretResponse, Lang }

export async function requestTranslation(
  text: string,
  source: Lang,
  quality: boolean,
): Promise<TranslateResponse['translations']> {
  const body: TranslateRequest = { text, source, quality }

  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': getPassword() ?? '',
    },
    body: JSON.stringify(body),
  })

  if (res.status === 401) {
    invalidatePassword()
    throw new Error('비밀번호가 올바르지 않습니다')
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? `요청 실패 (HTTP ${res.status})`)
  }

  const data = (await res.json()) as TranslateResponse
  return data.translations
}

/** 발화 WAV → 전사 + 언어감지 + 나머지 언어 번역. langs로 세션 언어(2~3개) 제한 */
export async function requestInterpretation(
  wav: Blob,
  quality: boolean,
  langs?: Lang[],
): Promise<InterpretResponse> {
  const body: InterpretRequest = {
    audio: await blobToBase64(wav),
    mimeType: 'audio/wav',
    quality,
    langs,
  }

  const res = await fetch('/api/interpret', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': getPassword() ?? '',
    },
    body: JSON.stringify(body),
  })

  if (res.status === 401) {
    invalidatePassword()
    throw new Error('비밀번호가 올바르지 않습니다')
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? `요청 실패 (HTTP ${res.status})`)
  }

  return (await res.json()) as InterpretResponse
}
