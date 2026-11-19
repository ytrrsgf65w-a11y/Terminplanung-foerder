import type { NextApiRequest, NextApiResponse } from 'next';
import { cookieName, isAuthorized, sessionCookie } from '../../../lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Methode nicht erlaubt.' });
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return res.status(503).json({ error: 'ADMIN_PASSWORD ist noch nicht eingerichtet.' });
  if (!password || password.length > 200 || password !== configured) {
    return res.status(401).json({ error: 'Das Kennwort stimmt nicht.' });
  }
  res.setHeader('Set-Cookie', sessionCookie(process.env.NODE_ENV === 'production'));
  return res.status(200).json({ ok: true, cookie: cookieName() });
}
