import type { VercelRequest } from '@vercel/node';

/** 공유 비밀번호 검증. APP_PASSWORD 미설정 시 항상 거부. */
export function isAuthorized(req: VercelRequest): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  const given = req.headers['x-app-password'];
  return typeof given === 'string' && given === expected;
}
