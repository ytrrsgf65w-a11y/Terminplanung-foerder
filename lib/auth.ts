import crypto from 'crypto';

const COOKIE_NAME = 'foerderplan_admin';
const SESSION_MAX_AGE = 60 * 60 * 8;

function signature(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('ADMIN_PASSWORD ist nicht konfiguriert.');
  return crypto.createHmac('sha256', secret).update('foerderplan-admin-session-v1').digest('hex');
}

export function isAuthorized(cookieHeader: string | undefined): boolean {
  if (!process.env.ADMIN_PASSWORD || !cookieHeader) return false;
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return false;
  const supplied = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1));
  const expected = signature();
  if (supplied.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export function sessionCookie(secure: boolean): string {
  return `${COOKIE_NAME}=${signature()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE}${secure ? '; Secure' : ''}`;
}

export function clearSessionCookie(secure: boolean): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure ? '; Secure' : ''}`;
}

export function unauthorized(res: import('next').NextApiResponse) {
  return res.status(401).json({ error: 'Bitte melden Sie sich zuerst an.' });
}

export function cookieName() { return COOKIE_NAME; }
