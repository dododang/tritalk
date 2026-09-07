import type { CaptureState } from '../hooks/useVoiceCapture'

/** 상태별 마이크 FAB. speaking일 때 맥동, starting일 때 스피너 */
export default function MicButton({
  state,
  onStart,
  onStop,
}: {
  state: CaptureState
  onStart: () => void
  onStop: () => void
}) {
  const active = state.kind !== 'idle' && state.kind !== 'error'
  const speaking = state.kind === 'speaking'
  const starting = state.kind === 'starting'

  return (
    <button
      type="button"
      onClick={active ? onStop : onStart}
      disabled={starting}
      aria-label={active ? '통역 중지' : '통역 시작'}
      className={`relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-colors ${
        active ? 'bg-red-500' : 'bg-violet-600'
      }`}
    >
      {speaking && (
        <span className="absolute inset-0 animate-ping rounded-full bg-red-500/60" />
      )}
      {starting ? (
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : active ? (
        // 정지 아이콘
        <span className="relative h-5 w-5 rounded-sm bg-white" />
      ) : (
        // 마이크 아이콘
        <svg viewBox="0 0 24 24" fill="white" className="relative h-7 w-7">
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
          <path d="M18 11a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.94V21h2v-2.06A8 8 0 0 0 20 11h-2Z" />
        </svg>
      )}
    </button>
  )
}
