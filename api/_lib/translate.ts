import { LANGS, LANG_LABEL, type Lang } from './types.js';

/** 앞에서부터 순서대로 시도, 혼잡(503)·한도(429)·미지원(404) 시 다음으로 폴백.
 *  기본(빠름): flash-lite 우선 (~1.5초 일정). 고급(quality): Flash 우선 (품질↑, 지연 편차 있음). */
export function modelChain(quality: boolean): string[] {
  const chain = quality
    ? ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-flash-lite-latest']
    : ['gemini-flash-lite-latest', 'gemini-3.8-flash', 'gemini-3.7-flash'];
  return [process.env.GEMINI_MODEL, ...chain].filter((m): m is string => Boolean(m));
}

/** source 텍스트를 나머지 두 언어로 번역한다. */
export async function translate(
  text: string,
  source: Lang,
  quality = false,
): Promise<Partial<Record<Lang, string>>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const targets = LANGS.filter((l) => l !== source);

  const prompt = [
    `You are a professional translator. Translate the ${LANG_LABEL[source]} text below into ${targets.map((t) => LANG_LABEL[t]).join(' and ')}.`,
    'Preserve the tone, politeness level, and nuance of the original.',
    'Output natural, everyday phrasing a native speaker would use.',
    '',
    `Text: ${text}`,
  ].join('\n');

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      thinkingConfig: { thinkingLevel: 'LOW' },
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: Object.fromEntries(targets.map((t) => [t, { type: 'string' }])),
        required: targets,
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

    const parsed = JSON.parse(raw) as Record<string, string>;
    const translations: Partial<Record<Lang, string>> = {};
    for (const t of targets) {
      if (typeof parsed[t] !== 'string') throw new Error(`missing translation for "${t}"`);
      translations[t] = parsed[t];
    }
    return translations;
  }

  throw new Error(`all Gemini models unavailable; last: ${lastError}`);
}
