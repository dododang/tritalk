import type { Lang } from '../lib/api'

const LANG_NATIVE: Record<Lang, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
}

const ALL: Lang[] = ['ko', 'en', 'ja']

/** 세션 언어 선택 칩 (최소 2개). 선택된 언어끼리만 인식·상호 번역 */
export default function LanguageChipBar({
  value,
  onChange,
}: {
  value: Lang[]
  onChange: (langs: Lang[]) => void
}) {
  function toggle(lang: Lang) {
    if (value.includes(lang)) {
      if (value.length <= 2) return // 최소 2개 유지
      onChange(value.filter((v) => v !== lang))
    } else {
      onChange(ALL.filter((v) => value.includes(v) || v === lang)) // ko→en→ja 순서 고정
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 px-4 pt-3">
      {ALL.map((lang) => {
        const on = value.includes(lang)
        return (
          <button
            key={lang}
            type="button"
            onClick={() => toggle(lang)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              on ? 'bg-sky-500/25 text-sky-300' : 'bg-white/5 text-slate-600'
            }`}
          >
            {LANG_NATIVE[lang]}
          </button>
        )
      })}
    </div>
  )
}
