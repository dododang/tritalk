import { useState } from 'react'
import { requestTranslation, type Lang } from '../lib/api'

const LANG_NATIVE: Record<Lang, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
}

const ALL_LANGS: Lang[] = ['ko', 'en', 'ja']

const QUALITY_KEY = 'tritalk.quality'

export default function TranslatePage() {
  const [source, setSource] = useState<Lang>('ko')
  const [text, setText] = useState('')
  const [results, setResults] = useState<Partial<Record<Lang, string>>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quality, setQuality] = useState(() => localStorage.getItem(QUALITY_KEY) === '1')

  function toggleQuality() {
    setQuality((prev) => {
      localStorage.setItem(QUALITY_KEY, prev ? '0' : '1')
      return !prev
    })
  }

  const targets = ALL_LANGS.filter((l) => l !== source)
  const canSubmit = text.trim().length > 0 && !loading

  async function handleTranslate() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    setResults({})
    try {
      setResults(await requestTranslation(text.trim(), source, quality))
    } catch (e) {
      setError(e instanceof Error ? e.message : '번역에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  function selectSource(lang: Lang) {
    setSource(lang)
    setResults({})
    setError(null)
  }

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col gap-4 p-4">
      {/* 고급 모드 토글 */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-slate-500">고급</span>
        <button
          type="button"
          role="switch"
          aria-checked={quality}
          onClick={toggleQuality}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            quality ? 'bg-sky-600' : 'bg-white/10'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
              quality ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* 원문 언어 선택 */}
      <div className="flex gap-2">
        {ALL_LANGS.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => selectSource(lang)}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
              source === lang
                ? 'bg-sky-600 text-white'
                : 'bg-white/5 text-slate-400 active:bg-white/10'
            }`}
          >
            {LANG_NATIVE[lang]}
          </button>
        ))}
      </div>

      {/* 입력 */}
      <div className="rounded-2xl bg-white/5 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`${LANG_NATIVE[source]} 문장을 입력하세요`}
          rows={4}
          className="w-full resize-none bg-transparent text-base text-slate-100 outline-none placeholder:text-slate-600"
        />
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setText('')
              setResults({})
              setError(null)
            }}
            className={`px-2 py-1 text-sm text-slate-500 active:text-slate-300 ${
              text ? 'visible' : 'invisible'
            }`}
          >
            지우기
          </button>
          <button
            type="button"
            onClick={() => void handleTranslate()}
            disabled={!canSubmit}
            className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          >
            {loading ? '번역 중…' : '번역'}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      {/* 결과 카드 */}
      {targets.map((lang) => (
        <ResultCard
          key={lang}
          label={LANG_NATIVE[lang]}
          text={results[lang]}
          loading={loading}
        />
      ))}
    </div>
  )
}

function ResultCard({
  label,
  text,
  loading,
}: {
  label: string
  text: string | undefined
  loading: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-sky-400">{label}</span>
        {text && (
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="text-xs text-slate-500 active:text-slate-300"
          >
            {copied ? '복사됨 ✓' : '복사'}
          </button>
        )}
      </div>
      {loading ? (
        <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
      ) : (
        <p className="min-h-5 text-base text-slate-100">
          {text ?? <span className="text-slate-600">—</span>}
        </p>
      )}
    </div>
  )
}
