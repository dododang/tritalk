export type Lang = 'ko' | 'en' | 'ja';

export const LANGS: Lang[] = ['ko', 'en', 'ja'];

export const LANG_LABEL: Record<Lang, string> = {
  ko: 'Korean',
  en: 'English',
  ja: 'Japanese',
};

/** POST /api/translate 요청 본문 */
export interface TranslateRequest {
  text: string;
  source: Lang;
  /** true면 고급(Flash) 모델 우선, false/생략이면 빠른 flash-lite 우선 */
  quality?: boolean;
}

/** POST /api/translate 응답 본문 */
export interface TranslateResponse {
  /** source를 제외한 나머지 두 언어의 번역 결과 */
  translations: Partial<Record<Lang, string>>;
}

/** ASR(전사) 결과 — 명세 §5 */
export interface ASRResult {
  lang: Lang;
  text: string;
  /** 언어 감지 신뢰도 0~1 */
  confidence: number;
}

/** POST /api/interpret 요청 본문 */
export interface InterpretRequest {
  /** base64 인코딩된 오디오 (data: 접두사 없이) */
  audio: string;
  /** 기본 'audio/wav' */
  mimeType?: string;
  /** true면 고급(Flash) 모델 우선 */
  quality?: boolean;
  /** 세션에서 쓸 언어 (2~3개). 생략 시 3개 전부. 감지·번역이 이 언어들로 제한됨 */
  langs?: Lang[];
  /** 직전 발화의 언어 — 짧은 발화("네", "Yes")의 언어 감지 보정에 사용 (명세 §6) */
  prevLang?: Lang;
}

/** POST /api/interpret 응답 본문 */
export interface InterpretResponse {
  asr: ASRResult;
  /** 감지된 언어를 제외한 나머지 두 언어의 번역 */
  translations: Partial<Record<Lang, string>>;
}
