import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Methode nicht erlaubt.' });
  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  const survey = slug ? await prisma.survey.findUnique({ where: { slug } }) : null;
  if (!survey || !survey.active) return res.status(404).json({ error: 'Diese Terminseite ist nicht verfügbar.' });
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 120) : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 1500) : '';
  const alternate = typeof req.body?.alternate === 'string' ? req.body.alternate.trim().slice(0, 250) : '';
  const preferences = req.body?.preferences;
  if (!name || name.length < 2) return res.status(400).json({ error: 'Bitte geben Sie Ihren Namen an.' });
  if (!Array.isArray(preferences) || preferences.length < 1 || preferences.length > 3) return res.status(400).json({ error: 'Bitte wählen Sie mindestens eine und höchstens drei Präferenzen.' });
  const slots = JSON.parse(survey.slots) as { id: string }[];
  const ids = new Set<string>();
  const ranks = new Set<number>();
  for (const preference of preferences) {
    if (!preference || typeof preference.slotId !== 'string' || !Number.isInteger(preference.rank) || preference.rank < 1 || preference.rank > 3 ||
        !slots.some((slot) => slot.id === preference.slotId) || ids.has(preference.slotId) || ranks.has(preference.rank)) {
      return res.status(400).json({ error: 'Die ausgewählten Präferenzen sind ungültig. Bitte versuchen Sie es erneut.' });
    }
    ids.add(preference.slotId);
    ranks.add(preference.rank);
  }
  const response = await prisma.response.create({
    data: { surveyId: survey.id, name, preferences: JSON.stringify(preferences), message, alternate },
  });
  return res.status(201).json({ ok: true, id: response.id });
}
