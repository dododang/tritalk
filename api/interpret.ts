import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthorized } from './_lib/auth.js';
import { interpret } from './_lib/interpret.js';
import { LANGS, type Lang, type InterpretRequest, type InterpretResponse } from './_lib/types.js';

/** base64 4MB ≈ 오디오 3MB ≈ 16kHz PCM16 WAV 약 90초 (Vercel 본문 한도 4.5MB 이내) */
const MAX_AUDIO_BASE64 = 4_000_000;

const ALLOWED_MIME = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { audio, mimeType, quality, langs, prevLang } = (req.body ?? {}) as Partial<InterpretRequest>;

  if (typeof audio !== 'string' || audio.length === 0) {
    return res.status(400).json({ error: 'audio (base64) is required' });
  }
  if (audio.length > MAX_AUDIO_BASE64) {
    return res.status(400).json({ error: 'audio is too long' });
  }
  const mime = mimeType ?? 'audio/wav';
  if (!ALLOWED_MIME.includes(mime)) {
    return res.status(400).json({ error: `mimeType must be one of ${ALLOWED_MIME.join(', ')}` });
  }

  let sessionLangs: Lang[] | undefined;
  if (langs !== undefined) {
    if (
      !Array.isArray(langs) ||
      langs.length < 2 ||
      langs.length > 3 ||
      langs.some((l) => !LANGS.includes(l as Lang)) ||
      new Set(langs).size !== langs.length
    ) {
      return res.status(400).json({ error: 'langs must be 2-3 distinct of ko/en/ja' });
    }
    sessionLangs = langs as Lang[];
  }

  if (prevLang !== undefined && !LANGS.includes(prevLang)) {
    return res.status(400).json({ error: 'prevLang must be one of ko/en/ja' });
  }

  try {
    const result = await interpret(audio, mime, quality === true, sessionLangs, prevLang);
    const body: InterpretResponse = result;
    return res.status(200).json(body);
  } catch (e) {
    console.error('interpret failed:', e);
    return res.status(502).json({ error: 'interpretation failed' });
  }
}
