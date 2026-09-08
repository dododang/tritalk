import { useState } from 'react'
import type { Lang } from '../lib/api'
import { speak, ttsSupported } from '../lib/tts'

const LANG_NATIVE: Record<Lang, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
}

const ALL_LANGS: Lang[] = ['ko', 'en', 'ja']

export interface UtteranceItem {
  seq: number
  status: 'processing' | 'done' | 'error'
  lang?: Lang
  text?: string
  translations?: Partial<Record<Lang, string>>
  error?: string
  /** 저장된 기록의 id (수정 시 DB 반영용) */
  dbId?: number
}

/** [언어 라벨] 원문 + 구분선 + [언어명] 번역문 버블 (명세 UI 레퍼런스).
 *  onRetranslate가 있으면 "수정" 버튼 노출 — 원문·언어를 고쳐 재번역 */
export default function UtteranceBubble({
  item,
  onRetranslate,
}: {
  item: UtteranceItem
  onRetranslate?: (seq: number, text: string, lang: Lang) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [editLang, setEditLang] = useState<Lang>('ko')

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

  if (editing) {
    return (
      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-sky-500/40">
        {/* 언어 선택 */}
        <div className="flex gap-1.5">
          {ALL_LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setEditLang(l)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                editLang === l ? 'bg-sky-500/25 text-sky-300' : 'bg-white/5 text-slate-500'
              }`}
            >
              {LANG_NATIVE[l]}
            </button>
          ))}
        </div>
        {/* 원문 수정 */}
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          rows={2}
          className="mt-3 w-full resize-none rounded-xl bg-white/5 p-3 text-base text-slate-100 outline-none"
        />
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 active:bg-white/10"
          >
            취소
          </button>
          <button
            type="button"
            disabled={editText.trim().length === 0}
            onClick={() => {
              setEditing(false)
              onRetranslate?.(item.seq, editText.trim(), editLang)
            }}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            재번역
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-sky-400">
            {item.lang ? LANG_NATIVE[item.lang] : ''}
          </p>
          <p className="mt-0.5 text-base text-slate-100">{item.text}</p>
        </div>
        {onRetranslate && (
          <button
            type="button"
            onClick={() => {
              setEditText(item.text ?? '')
              setEditLang(item.lang ?? 'ko')
              setEditing(true)
            }}
            className="mt-0.5 shrink-0 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors active:bg-white/15"
          >
            수정
          </button>
        )}
      </div>
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
