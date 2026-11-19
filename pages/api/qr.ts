import type { NextApiRequest, NextApiResponse } from 'next';
import QRCode from 'qrcode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' || typeof req.query.slug !== 'string' || !/^[a-z0-9-]{1,60}$/i.test(req.query.slug)) {
    return res.status(400).end();
  }
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (!base) return res.status(503).json({ error: 'NEXT_PUBLIC_APP_URL ist nicht eingerichtet.' });
  const png = await QRCode.toBuffer(`${base}/${req.query.slug}`, { type: 'png', width: 320, margin: 2 });
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(png);
}
