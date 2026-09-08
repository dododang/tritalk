import { useCallback, useEffect, useRef, useState } from 'react'
import MicButton from '../components/MicButton'
import UtteranceBubble, { type UtteranceItem } from '../components/UtteranceBubble'
import { useVoiceCapture } from '../hooks/useVoiceCapture'
import { requestInterpretation } from '../lib/api'
import { durationSec, encodeWav } from '../lib/audio'
import db, { pruneEmptySessions } from '../lib/db'

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
  // 현재 세션 id (마이크 시작 시 생성). Promise인 이유: 생성 완료 전에 발화가 끝날 수 있음
  const sessionRef = useRef<Promise<number> | null>(null)

  const handleUtterance = useCallback((audio: Float32Array) => {
    // 너무 짧은 조각(0.3초 미만)은 버림
    if (durationSec(audio) < 0.3) return

    const sessionPromise = sessionRef.current // 캡처 시점의 세션 (정지 후 완료돼도 원래 세션에 저장)
    const seq = seqRef.current++
    setItems((prev) => [...prev, { seq, status: 'processing' }])

    // 비동기로 던지고 즉시 다음 발화 청취로 복귀 (seq로 버블 순서 보장)
    void (async () => {
      try {
        // 번역 탭의 "고급" 토글 설정 공유 — on이면 전사 정확도 높은 Flash 우선
        const quality = localStorage.getItem('tritalk.quality') === '1'
        const { asr, translations } = await requestInterpretation(encodeWav(audio), quality)
        setItems((prev) =>
          asr.text.trim().length === 0
            ? prev.filter((it) => it.seq !== seq) // 말소리 없음 → 버블 제거
            : prev.map((it) =>
                it.seq === seq
                  ? { seq, status: 'done' as const, lang: asr.lang, text: asr.text, translations }
                  : it,
              ),
        )
        // 대화 기록 저장 (실패해도 통역 UI에는 영향 없음)
        if (asr.text.trim().length > 0 && sessionPromise) {
          try {
            const sessionId = await sessionPromise
            await db.utterances.add({
              sessionId,
              createdAt: Date.now(),
              lang: asr.lang,
              text: asr.text,
              translations,
            })
          } catch (err) {
            console.error('대화 기록 저장 실패', err)
          }
        }
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

  // 진입 시 빈 세션 정리
  useEffect(() => {
    void pruneEmptySessions().catch(() => {})
  }, [])

  // 마이크가 멈추면(정지·에러·백그라운드 전환) 세션 종료 처리
  useEffect(() => {
    if ((state.kind === 'idle' || state.kind === 'error') && sessionRef.current) {
      const sessionPromise = sessionRef.current
      sessionRef.current = null
      void sessionPromise
        .then((id) => db.sessions.update(id, { endedAt: Date.now() }))
        .catch(() => {})
    }
  }, [state.kind])

  const handleStart = useCallback(() => {
    sessionRef.current = db.sessions.add({ startedAt: Date.now(), endedAt: null })
    void start()
  }, [start])

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
        <MicButton state={state} onStart={handleStart} onStop={stop} />
      </div>
    </div>
  )
}
