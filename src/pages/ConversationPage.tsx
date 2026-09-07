import { useCallback, useEffect, useRef, useState } from 'react'
import MicButton from '../components/MicButton'
import UtteranceBubble, { type UtteranceItem } from '../components/UtteranceBubble'
import { useVoiceCapture } from '../hooks/useVoiceCapture'
import { requestInterpretation } from '../lib/api'
import { durationSec, encodeWav } from '../lib/audio'

const STATUS_LABEL: Record<string, string> = {
  idle: '버튼을 눌러 통역을 시작하세요',
  starting: '마이크 준비 중…',
  listening: '듣고 있어요',
  speaking: '말하는 중…',
}

export default function ConversationPage() {
  const [items, setItems] = useState<UtteranceItem[]>([])
  const seqRef = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)

  const handleUtterance = useCallback((audio: Float32Array) => {
    // 너무 짧은 조각(0.3초 미만)은 버림
    if (durationSec(audio) < 0.3) return

    const seq = seqRef.current++
    setItems((prev) => [...prev, { seq, status: 'processing' }])

    // 비동기로 던지고 즉시 다음 발화 청취로 복귀 (seq로 버블 순서 보장)
    void (async () => {
      try {
        const { asr, translations } = await requestInterpretation(encodeWav(audio))
        setItems((prev) =>
          asr.text.trim().length === 0
            ? prev.filter((it) => it.seq !== seq) // 말소리 없음 → 버블 제거
            : prev.map((it) =>
                it.seq === seq
                  ? { seq, status: 'done' as const, lang: asr.lang, text: asr.text, translations }
                  : it,
              ),
        )
      } catch (e) {
        const message = e instanceof Error ? e.message : '통역에 실패했습니다'
        setItems((prev) =>
          prev.map((it) => (it.seq === seq ? { seq, status: 'error' as const, error: message } : it)),
        )
      }
    })()
  }, [])

  const { state, start, stop } = useVoiceCapture({ onUtterance: handleUtterance })

  // 새 버블·스켈레톤 추가 시 맨 아래로 스크롤
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [items])

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col">
      {/* 버블 리스트 */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-600">
              발화가 끝날 때마다 자동으로 번역 버블이 올라옵니다
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <UtteranceBubble key={item.seq} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* 하단 상태 + 마이크 */}
      <div className="flex flex-col items-center gap-2 pb-4">
        {state.kind === 'error' ? (
          <p className="px-4 text-center text-sm text-red-400">{state.message}</p>
        ) : (
          <p className="text-sm text-gray-500">{STATUS_LABEL[state.kind]}</p>
        )}
        <MicButton state={state} onStart={() => void start()} onStop={stop} />
      </div>
    </div>
  )
}
