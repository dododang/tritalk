import { LANGS, LANG_LABEL, type Lang } from './types';

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/** source 텍스트를 나머지 두 언어로 번역한다. */
export async function translate(
  text: string,
  source: Lang,
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

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
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
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini API returned no text');

  const parsed = JSON.parse(raw) as Record<string, string>;
  const translations: Partial<Record<Lang, string>> = {};
  for (const t of targets) {
    if (typeof parsed[t] !== 'string') throw new Error(`missing translation for "${t}"`);
    translations[t] = parsed[t];
  }
  return translations;
}
