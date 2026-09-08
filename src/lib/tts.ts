import type { Lang } from './api'

const TTS_LANG: Record<Lang, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
}

export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

let current = 0

/**
 * 브라우저 내장 TTS로 재생 (무료, 기기 내 처리).
 * 재생 중이면 끊고 새로 재생. 시작/종료를 window 이벤트로 알려
 * 대화 탭이 재생 중 VAD를 일시정지할 수 있게 한다 (자기 목소리 인식 방지).
 */
export function speak(text: string, lang: Lang): void {
  if (!ttsSupported) return
  const id = ++current
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = TTS_LANG[lang]
  const done = () => {
    // 뒤에 새 재생이 시작됐으면(cancel로 인한 종료) end를 쏘지 않음
    if (id === current) window.dispatchEvent(new Event('tritalk:tts-end'))
  }
  u.onend = done
  u.onerror = done
  window.dispatchEvent(new Event('tritalk:tts-start'))
  speechSynthesis.speak(u)
}
