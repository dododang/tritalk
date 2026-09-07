import { LANGS, LANG_LABEL, type ASRResult, type Lang } from './types.js';
import { modelChain } from './translate.js';

/** 명세 §5 ASR 어댑터 인터페이스.
 *  현재는 경로 A(Gemini 멀티모달 단일 호출)라 별도 구현체가 없지만,
 *  고유명사 정확도가 아쉬우면 전용 ASR(Whisper 등)로 이 인터페이스를 구현해 교체한다. */
export interface ASRProvider {
  transcribe(audio: Buffer, hintLangs: Lang[]): Promise<ASRResult>;
}

export interface InterpretResult {
  asr: ASRResult;
  translations: Partial<Record<Lang, string>>;
}

/** 오디오 → 전사 + 언어 감지 + 나머지 두 언어 번역 (Gemini 멀티모달 단일 호출) */
export async function interpret(
  audioBase64: string,
  mimeType: string,
  quality = false,
): Promise<InterpretResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const prompt = [
    'You are a professional interpreter. The audio contains speech in Korean, English, or Japanese.',
    '1. Transcribe exactly what was said, in the original language.',
    '2. Detect the language: ko (Korean), en (English), or ja (Japanese). Give a confidence between 0 and 1.',
    '3. Provide the text in all three languages: for the detected language, repeat the transcription; for the other two, translate it.',
    'Preserve the tone, politeness level, and nuance. Output natural, everyday phrasing a native speaker would use.',
    'CRITICAL: Transcribe ONLY what is actually audible. Never add greetings, sentence openings, or endings that were not spoken.',
    'The audio may be a fragment cut mid-sentence — if so, transcribe the fragment as-is without completing it into a full sentence.',
    'If a word is unclear, transcribe your best guess of the actual sound. Do not invent plausible-sounding replacements.',
    'If the audio contains no discernible speech, return an empty transcription with confidence 0.',
  ].join('\n');

  const body = JSON.stringify({
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: audioBase64 } },
        ],
      },
    ],
    generationConfig: {
      thinkingConfig: { thinkingLevel: 'LOW' },
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          lang: { type: 'string', enum: LANGS },
          confidence: { type: 'number' },
          ...Object.fromEntries(LANGS.map((l) => [l, { type: 'string' }])),
        },
        required: ['lang', 'confidence', ...LANGS],
        propertyOrdering: ['lang', 'confidence', ...LANGS],
      },
    },
  });

  let lastError = '';
  for (const model of modelChain(quality)) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body,
      },
    );

    if (!res.ok) {
      lastError = `${model} → ${res.status}: ${(await res.text()).slice(0, 300)}`;
      // 혼잡(503)·한도 초과(429)·미지원(404)이면 다음 모델로 폴백
      if ([503, 429, 404].includes(res.status)) {
        console.warn(`falling back from ${model} (${res.status})`);
        continue;
      }
      throw new Error(`Gemini API error: ${lastError}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error(`Gemini API returned no text (${model})`);

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const lang = parsed.lang as Lang;
    if (!LANGS.includes(lang)) throw new Error(`invalid detected lang "${String(parsed.lang)}"`);

    const text = typeof parsed[lang] === 'string' ? (parsed[lang] as string) : '';
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0;

    const translations: Partial<Record<Lang, string>> = {};
    for (const l of LANGS) {
      if (l === lang) continue;
      if (typeof parsed[l] !== 'string') {
        throw new Error(`missing translation for "${LANG_LABEL[l]}"`);
      }
      translations[l] = parsed[l] as string;
    }

    return { asr: { lang, text, confidence }, translations };
  }

  throw new Error(`all Gemini models unavailable; last: ${lastError}`);
}
