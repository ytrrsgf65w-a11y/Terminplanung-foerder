import type { NextApiRequest, NextApiResponse } from 'next';
import { isAuthorized, unauthorized } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req.headers.cookie)) return unauthorized(res);
  if (req.method === 'GET') {
    const surveys = await prisma.survey.findMany({
      orderBy: { createdAt: 'desc' },
      include: { responses: { orderBy: { createdAt: 'desc' } } },
    });
    return res.status(200).json(surveys.map((survey) => ({
      id: survey.id,
      slug: survey.slug,
      title: survey.title,
      intro: survey.intro,
      active: survey.active,
      createdAt: survey.createdAt,
      slots: JSON.parse(survey.slots),
      responses: survey.responses.map((response) => ({
        id: response.id,
        name: response.name,
        preferences: JSON.parse(response.preferences),
        message: response.message,
        alternate: response.alternate,
        createdAt: response.createdAt,
      })),
    })));
  }
  if (req.method === 'POST') {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 120) : '';
    const intro = typeof req.body?.intro === 'string' ? req.body.intro.trim().slice(0, 1000) : '';
    const slots = req.body?.slots;
    if (!title || !Array.isArray(slots) || slots.length < 1 || slots.length > 60) {
      return res.status(400).json({ error: 'Bitte geben Sie einen Titel und 1 bis 60 Termine an.' });
    }
    const normalized = slots.map((slot: { date?: unknown; start?: unknown; end?: unknown }, index: number) => {
      if (typeof slot?.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(slot.date) ||
          typeof slot?.start !== 'string' || !/^\d{2}:\d{2}$/.test(slot.start) ||
          typeof slot?.end !== 'string' || !/^\d{2}:\d{2}$/.test(slot.end) || slot.end <= slot.start) return null;
      return { id: `slot-${index + 1}`, date: slot.date, start: slot.start, end: slot.end };
    });
    if (normalized.some((slot) => slot === null)) return res.status(400).json({ error: 'Bitte prüfen Sie Datum, Beginn und Ende aller Termine.' });
    const slug = `${Math.random().toString(36).slice(2, 6)}-${Date.now().toString(36)}`;
    const survey = await prisma.survey.create({ data: { slug, title, intro, slots: JSON.stringify(normalized) } });
    return res.status(201).json({ id: survey.id, slug: survey.slug });
  }
  if (req.method === 'PATCH') {
    const { id, active } = req.body ?? {};
    if (typeof id !== 'string' || typeof active !== 'boolean') return res.status(400).json({ error: 'Ungültige Anfrage.' });
    const survey = await prisma.survey.updateMany({ where: { id }, data: { active } });
    return survey.count ? res.status(200).json({ ok: true }) : res.status(404).json({ error: 'Terminserie nicht gefunden.' });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body ?? {};
    if (typeof id !== 'string') return res.status(400).json({ error: 'Ungültige Anfrage.' });
    const survey = await prisma.survey.deleteMany({ where: { id } });
    return survey.count ? res.status(200).json({ ok: true }) : res.status(404).json({ error: 'Terminserie nicht gefunden.' });
  }
  return res.status(405).json({ error: 'Methode nicht erlaubt.' });
}
