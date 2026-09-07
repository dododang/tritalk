import type { VercelRequest, VercelResponse } from '@vercel/node';
import { translate } from './_lib/translate';
import { LANGS, type Lang, type TranslateRequest, type TranslateResponse } from './_lib/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // TODO(Phase 1 섹션 3): 공유 비밀번호 검증 추가

  const { text, source } = (req.body ?? {}) as Partial<TranslateRequest>;

  if (typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (text.length > 5000) {
    return res.status(400).json({ error: 'text is too long (max 5000 chars)' });
  }
  if (!source || !LANGS.includes(source as Lang)) {
    return res.status(400).json({ error: 'source must be one of ko/en/ja' });
  }

  try {
    const translations = await translate(text.trim(), source as Lang);
    const body: TranslateResponse = { translations };
    return res.status(200).json(body);
  } catch (e) {
    console.error('translate failed:', e);
    return res.status(502).json({ error: 'translation failed' });
  }
}
