import type { Lang } from '../lib/api'
import { speak, ttsSupported } from '../lib/tts'

const LANG_NATIVE: Record<Lang, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
}

export interface UtteranceItem {
  seq: number
  status: 'processing' | 'done' | 'error'
  lang?: Lang
  text?: string
  translations?: Partial<Record<Lang, string>>
  error?: string
}

/** [언어 라벨] 원문 + 구분선 + [언어명] 번역문 버블 (명세 UI 레퍼런스) */
export default function UtteranceBubble({ item }: { item: UtteranceItem }) {
  if (item.status === 'processing') {
    return (
      <div className="rounded-2xl bg-white/5 p-4">
        <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-white/10" />
      </div>
    )
  }

  if (item.status === 'error') {
    return (
      <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-400">
        {item.error ?? '통역에 실패했습니다'}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-xs font-medium text-sky-400">
        {item.lang ? LANG_NATIVE[item.lang] : ''}
      </p>
      <p className="mt-0.5 text-base text-slate-100">{item.text}</p>
      <div className="my-3 border-t border-white/10" />
      <div className="flex flex-col gap-2">
        {Object.entries(item.translations ?? {}).map(([lang, text]) => (
          <div key={lang} className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">{LANG_NATIVE[lang as Lang]}</p>
              <p className="text-base text-slate-200">{text}</p>
            </div>
            {ttsSupported && (
              <button
                type="button"
                onClick={() => speak(text, lang as Lang)}
                className="mt-0.5 shrink-0 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors active:bg-white/15"
              >
                듣기
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
