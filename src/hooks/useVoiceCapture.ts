import type { MicVAD } from '@ricky0123/vad-web'
import { useCallback, useEffect, useRef, useState } from 'react'

export type CaptureState =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'listening' }
  | { kind: 'speaking' }
  | { kind: 'processing'; jobs: number }
  | { kind: 'error'; message: string }

/**
 * 마이크 캡처 + Silero VAD 발화 감지 훅.
 * - start()는 반드시 사용자 제스처(버튼 탭) 안에서 호출할 것 (iOS 제약)
 * - 발화가 끝나면 onUtterance(16kHz Float32Array) 호출
 * - processing 상태는 표시하지 않음: 캡처는 계속 listening/speaking으로 유지되고,
 *   번역 작업 개수 표시는 상위 컴포넌트가 관리 (jobs 상태는 §8 타입 호환용)
 */
export function useVoiceCapture(opts: {
  onUtterance: (audio: Float32Array) => void
}): {
  state: CaptureState
  start: () => Promise<void>
  stop: () => void
} {
  const [state, setState] = useState<CaptureState>({ kind: 'idle' })
  const vadRef = useRef<MicVAD | null>(null)
  const onUtteranceRef = useRef(opts.onUtterance)
  onUtteranceRef.current = opts.onUtterance

  const stop = useCallback(() => {
    vadRef.current?.destroy()
    vadRef.current = null
    setState({ kind: 'idle' })
  }, [])

  const start = useCallback(async () => {
    if (vadRef.current) return
    setState({ kind: 'starting' })
    try {
      // VAD+onnxruntime(~400KB)은 첫 시작 때만 동적 로드 (메인 번들 경량 유지)
      const { MicVAD } = await import('@ricky0123/vad-web')
      const vad = await MicVAD.new({
        model: 'v5',
        baseAssetPath: '/vad/',
        onnxWASMBasePath: '/vad/',
        // 원거리·작은 목소리도 잡도록 문턱 완화 (0.8은 멀리서 말하면 발화 인식 안 됨)
        positiveSpeechThreshold: 0.6,
        negativeSpeechThreshold: 0.45,
        minSpeechMs: 250, // 이보다 짧으면 잡음으로 간주 (misfire)
        redemptionMs: 800, // 이만큼 무음이어야 발화 종료 — 문장 중 쉼에 끊기지 않게 (명세 권장 ~0.8초)
        preSpeechPadMs: 500, // 발화 시작 직전 오디오 포함 (첫 음절 잘림 방지)
        getStream: () =>
          navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }),
        onSpeechStart: () => setState({ kind: 'speaking' }),
        onVADMisfire: () => setState({ kind: 'listening' }),
        onSpeechEnd: (audio: Float32Array) => {
          setState({ kind: 'listening' })
          onUtteranceRef.current(audio)
        },
      })
      vadRef.current = vad
      vad.start()
      setState({ kind: 'listening' })
    } catch (e) {
      vadRef.current = null
      const message =
        e instanceof DOMException && e.name === 'NotAllowedError'
          ? '마이크 권한이 거부되었습니다. 설정에서 허용해주세요.'
          : e instanceof Error
            ? e.message
            : '마이크를 시작할 수 없습니다'
      setState({ kind: 'error', message })
    }
  }, [])

  // 백그라운드 전환 시 캡처 중단 (iOS에서 오디오 세션이 어차피 끊김)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'hidden' && vadRef.current) {
        stop()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [stop])

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      vadRef.current?.destroy()
      vadRef.current = null
    }
  }, [])

  return { state, start, stop }
}
