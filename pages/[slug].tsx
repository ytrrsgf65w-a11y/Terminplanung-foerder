import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

type Slot = { id: string; date: string; start: string; end: string };
type Survey = { slug: string; title: string; intro: string; slots: Slot[] };

function prettyDate(date: string) {
  return new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

export default function ParentForm() {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [alternate, setAlternate] = useState('');
  const [ranks, setRanks] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const slug = typeof window !== 'undefined' ? window.location.pathname.slice(1).split('/')[0] : '';

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/surveys/${encodeURIComponent(slug)}`).then(async (r) => {
      if (!r.ok) throw new Error('Diese Terminseite ist nicht verfügbar.');
      setSurvey(await r.json());
    }).catch((e) => setError(e.message));
  }, [slug]);

  const selectedCount = useMemo(() => Object.values(ranks).filter(Boolean).length, [ranks]);
  function updateRank(slotId: string, value: string) {
    setRanks((current) => {
      const next = { ...current };
      if (value) {
        for (const [id, rank] of Object.entries(next)) if (rank === value) delete next[id];
        next[slotId] = value;
      } else delete next[slotId];
      return next;
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!survey) return;
    setError('');
    setSending(true);
    try {
      const preferences = Object.entries(ranks).filter(([, rank]) => rank).map(([slotId, rank]) => ({ slotId, rank: Number(rank) }));
      const response = await fetch(`/api/surveys/${encodeURIComponent(survey.slug)}/responses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, alternate, preferences }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Die Rückmeldung konnte nicht gesendet werden.');
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Ein Fehler ist aufgetreten.'); }
    finally { setSending(false); }
  }

  return <main className="container narrow">
    <header className="page-header"><div className="brand-mark small">TF</div><span>Terminplanung</span></header>
    {!survey && !error && <div className="card">Die Terminvorschläge werden geladen …</div>}
    {error && !survey && <div className="card"><p className="notice error">{error}</p></div>}
    {survey && <>
      <section className="intro-card"><span className="eyebrow">Förderplangespräch</span><h1>{survey.title}</h1><p>{survey.intro || 'Bitte wählen Sie bis zu drei passende Termine und ordnen Sie diese nach Ihrer Präferenz.'}</p></section>
      {done ? <section className="card success-card"><div className="success-icon">✓</div><h2>Vielen Dank für Ihre Rückmeldung!</h2><p>Ihre Auswahl wurde übermittelt. Nur die zuständige Person kann Ihre Angaben sehen.</p></section> :
      <form className="card form-card" onSubmit={submit}>
        <div className="privacy-note">🔒 Ihre Rückmeldung ist nur für die zuständige Person sichtbar.</div>
        <div className="field"><label htmlFor="name">Ihr Name <span className="required">*</span></label><input id="name" autoComplete="name" maxLength={120} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Vor- und Nachname" /></div>
        <div className="section-heading"><div><h2>Termine auswählen</h2><p>Wählen Sie bis zu drei Termine und vergeben Sie unterschiedliche Präferenzen.</p></div><span className="count-pill">{selectedCount}/3</span></div>
        <div className="slot-list">{survey.slots.map((slot) => <div className="parent-slot" key={slot.id}>
          <div><strong>{prettyDate(slot.date)}</strong><span>{slot.start}–{slot.end} Uhr</span></div>
          <select aria-label={`Präferenz für ${prettyDate(slot.date)} ${slot.start}`} value={ranks[slot.id] || ''} onChange={(e) => updateRank(slot.id, e.target.value)}>
            <option value="">Nicht auswählen</option><option value="1">1. Präferenz</option><option value="2">2. Präferenz</option><option value="3">3. Präferenz</option>
          </select>
        </div>)}</div>
        <div className="field"><label htmlFor="alternate">Keiner der Termine passt? Machen Sie einen eigenen Vorschlag (optional)</label><input id="alternate" maxLength={250} value={alternate} onChange={(e) => setAlternate(e.target.value)} placeholder="z. B. Dienstag, 14. Mai, ab 15 Uhr" /></div>
        <div className="field"><label htmlFor="message">Nachricht (optional)</label><textarea id="message" maxLength={1500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ihre Nachricht an die zuständige Person" /></div>
        {error && <p className="notice error" role="alert">{error}</p>}
        <button className="button primary full" disabled={sending || selectedCount === 0}>{sending ? 'Wird gesendet …' : 'Rückmeldung senden'}</button>
        <p className="form-footnote">Bitte übermitteln Sie über dieses Formular keine vertraulichen Angaben zur Förderung oder Gesundheit Ihres Kindes.</p>
      </form>}
      <footer className="footer">Ihre Angaben werden ausschließlich zur Terminabstimmung verwendet.</footer>
    </>}
  </main>;
}
