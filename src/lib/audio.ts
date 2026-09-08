/** VAD가 반환하는 오디오 샘플레이트 (Silero VAD 고정값) */
export const VAD_SAMPLE_RATE = 16000

/**
 * Float32Array PCM → 16kHz mono PCM16 WAV 인코딩.
 * 입력이 이미 16kHz가 아니면 선형 보간으로 다운샘플한다.
 */
export function encodeWav(
  samples: Float32Array,
  inputSampleRate: number = VAD_SAMPLE_RATE,
): Blob {
  const pcm =
    inputSampleRate === VAD_SAMPLE_RATE
      ? samples
      : downsample(samples, inputSampleRate, VAD_SAMPLE_RATE)

  const buffer = new ArrayBuffer(44 + pcm.length * 2)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + pcm.length * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // fmt 청크 크기
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, VAD_SAMPLE_RATE, true)
  view.setUint32(28, VAD_SAMPLE_RATE * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeString(view, 36, 'data')
  view.setUint32(40, pcm.length * 2, true)

  let offset = 44
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

/**
 * 조용한(멀리서 말한) 발화 증폭 — 피크 정규화.
 * maxGain 제한으로 잡음뿐인 오디오의 과증폭을 방지한다.
 */
export function normalize(
  samples: Float32Array,
  targetPeak = 0.95,
  maxGain = 10,
): Float32Array {
  let peak = 0
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i])
    if (a > peak) peak = a
  }
  if (peak === 0) return samples
  const gain = Math.min(targetPeak / peak, maxGain)
  if (gain <= 1) return samples // 이미 충분히 큼
  const out = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] * gain
  return out
}

/** 선형 보간 다운샘플 */
export function downsample(
  samples: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) return samples
  const ratio = fromRate / toRate
  const length = Math.floor(samples.length / ratio)
  const result = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    const pos = i * ratio
    const left = Math.floor(pos)
    const right = Math.min(left + 1, samples.length - 1)
    const frac = pos - left
    result[i] = samples[left] * (1 - frac) + samples[right] * frac
  }
  return result
}

/** Blob → base64 문자열 (data: 접두사 제거) */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.slice(dataUrl.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** 발화 길이(초) 계산 */
export function durationSec(samples: Float32Array): number {
  return samples.length / VAD_SAMPLE_RATE
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}
