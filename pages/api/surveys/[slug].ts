import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Methode nicht erlaubt.' });
  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!slug) return res.status(404).json({ error: 'Terminseite nicht gefunden.' });
  const survey = await prisma.survey.findUnique({ where: { slug } });
  if (!survey || !survey.active) return res.status(404).json({ error: 'Diese Terminseite ist nicht verfügbar.' });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ id: survey.id, slug: survey.slug, title: survey.title, intro: survey.intro, slots: JSON.parse(survey.slots) });
}
