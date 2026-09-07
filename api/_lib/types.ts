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
