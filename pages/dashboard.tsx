import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

type Slot = { id: string; date: string; start: string; end: string };
type Preference = { slotId: string; rank: number };
type Answer = { id: string; name: string; preferences: Preference[]; message: string; alternate: string; createdAt: string };
type Survey = { id: string; slug: string; title: string; intro: string; active: boolean; createdAt: string; slots: Slot[]; responses: Answer[] };

const dateLabel = (date: string, options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => new Intl.DateTimeFormat('de-DE', { ...options, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));

export default function Dashboard() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterRank, setFilterRank] = useState('');
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [slots, setSlots] = useState([{ date: '', start: '15:00', end: '15:30' }]);
  const [openSurvey, setOpenSurvey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/surveys');
    if (response.status === 401) { setLoggedIn(false); return; }
    if (!response.ok) throw new Error('Die Daten konnten nicht geladen werden.');
    setSurveys(await response.json());
    setLoggedIn(true);
  }, []);
  useEffect(() => { load().catch((e) => setError(e.message)); }, [load]);

  async function login(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Anmeldung fehlgeschlagen.');
      setPassword(''); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Anmeldung fehlgeschlagen.'); }
    finally { setBusy(false); }
  }

  async function createSurvey(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const response = await fetch('/api/admin/surveys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, intro, slots }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Die Terminserie konnte nicht angelegt werden.');
      setTitle(''); setIntro(''); setSlots([{ date: '', start: '15:00', end: '15:30' }]);
      await load(); setOpenSurvey(result.id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Ein Fehler ist aufgetreten.'); }
    finally { setBusy(false); }
  }

  async function changeSurvey(id: string, changes: { active?: boolean; delete?: boolean }) {
    if (changes.delete && !window.confirm('Terminserie und alle dazugehörigen Rückmeldungen endgültig löschen?')) return;
    const response = await fetch('/api/admin/surveys', { method: changes.delete ? 'DELETE' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes.delete ? { id } : { id, active: changes.active }) });
    if (!response.ok) { setError('Die Änderung konnte nicht gespeichert werden.'); return; }
    await load();
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' }); setLoggedIn(false); setSurveys([]);
  }

  const allResponses = useMemo(() => surveys.flatMap((survey) => survey.responses.map((response) => ({ ...response, survey, preferences: response.preferences.map((pref) => ({ ...pref, slot: survey.slots.find((slot) => slot.id === pref.slotId) })).filter((pref) => pref.slot) }))), [surveys]);
  const filteredResponses = allResponses.filter((response) => {
    const dateMatches = !filterDate || response.preferences.some((pref) => pref.slot?.date === filterDate);
    const rankMatches = !filterRank || response.preferences.some((pref) => String(pref.rank) === filterRank);
    return dateMatches && rankMatches;
  });
  const nextDates = [...new Set(surveys.flatMap((survey) => survey.slots.map((slot) => slot.date)))].sort();

  if (!loggedIn) return <main className="container narrow dashboard-login"><div className="page-header"><div className="brand-mark small">TF</div><span>Verwaltung</span></div>
    <form className="card login-card" onSubmit={login}><span className="eyebrow">Geschützter Bereich</span><h1>Willkommen zurück</h1><p>Melden Sie sich mit Ihrem Administrator-Kennwort an.</p>
      <div className="field"><label htmlFor="password">Administrator-Kennwort</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      {error && <p className="notice error">{error}</p>}<button className="button primary full" disabled={busy}>{busy ? 'Anmeldung …' : 'Anmelden'}</button>
      <a className="back-link" href="/">Zur Startseite</a>
    </form>
  </main>;

  return <main className="container dashboard">
    <header className="dashboard-header"><div><div className="page-header"><div className="brand-mark small">TF</div><span>Verwaltung</span></div><h1>Terminübersicht</h1><p>Erstellen Sie Terminserien und behalten Sie Rückmeldungen im Blick.</p></div><button className="button secondary" onClick={logout}>Abmelden</button></header>
    {error && <p className="notice error">{error}</p>}
    <section className="dashboard-grid">
      <form className="card create-card" onSubmit={createSurvey}><span className="eyebrow">Neue Terminserie</span><h2>Termine vorschlagen</h2>
        <div className="field"><label htmlFor="title">Titel</label><input id="title" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Förderplangespräche – Klasse 4a" /></div>
        <div className="field"><label htmlFor="intro">Hinweis für Eltern (optional)</label><textarea id="intro" maxLength={1000} value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Kurze Information zur Terminabstimmung" /></div>
        <div className="section-heading"><div><h3>Terminoptionen</h3><p>Geben Sie Datum und Zeitfenster an.</p></div><button type="button" className="button secondary compact" onClick={() => setSlots([...slots, { date: '', start: '15:00', end: '15:30' }])} disabled={slots.length >= 60}>+ Termin</button></div>
        {slots.map((slot, index) => <div className="slot-editor" key={index}><div className="field"><label>Datum</label><input type="date" required value={slot.date} onChange={(e) => setSlots(slots.map((item, i) => i === index ? { ...item, date: e.target.value } : item))} /></div><div className="field"><label>Von</label><input type="time" required value={slot.start} onChange={(e) => setSlots(slots.map((item, i) => i === index ? { ...item, start: e.target.value } : item))} /></div><div className="field"><label>Bis</label><input type="time" required value={slot.end} onChange={(e) => setSlots(slots.map((item, i) => i === index ? { ...item, end: e.target.value } : item))} /></div><button type="button" className="remove-slot" aria-label="Termin entfernen" onClick={() => setSlots(slots.filter((_, i) => i !== index))} disabled={slots.length === 1}>×</button></div>)}
        <button className="button primary full" disabled={busy}>{busy ? 'Wird erstellt …' : 'Terminserie erstellen'}</button>
      </form>
      <section className="card calendar-card"><span className="eyebrow">Kalender</span><h2>Vorgeschlagene Termine</h2><p>Alle angebotenen Zeitslots nach Datum.</p>
        <div className="calendar-list">{nextDates.length === 0 && <p className="empty">Noch keine Termine angelegt.</p>}{nextDates.map((date) => <div className="calendar-item" key={date}><div className="calendar-date"><strong>{dateLabel(date, { day: '2-digit' })}</strong><span>{dateLabel(date, { month: 'short' })}</span></div><div>{surveys.flatMap((survey) => survey.slots.filter((slot) => slot.date === date).map((slot) => <div className="calendar-event" key={`${survey.id}-${slot.id}`}><span className="day-dot"/><div><strong>{slot.start}–{slot.end}</strong><span>{survey.title}</span></div></div>))}</div></div>)}</div>
      </section>
    </section>
    <section className="card responses-card"><div className="section-heading"><div><span className="eyebrow">Privat</span><h2>Rückmeldungen <span className="count-pill">{filteredResponses.length}</span></h2><p>Diese Angaben sind ausschließlich in Ihrem geschützten Dashboard sichtbar.</p></div></div>
      <div className="filters"><div className="field"><label htmlFor="filter-date">Nach Termin filtern</label><select id="filter-date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}><option value="">Alle Daten</option>{nextDates.map((date) => <option key={date} value={date}>{dateLabel(date, { day: 'numeric', month: 'long', year: 'numeric' })}</option>)}</select></div><div className="field"><label htmlFor="filter-rank">Nach Präferenz filtern</label><select id="filter-rank" value={filterRank} onChange={(e) => setFilterRank(e.target.value)}><option value="">Alle Präferenzen</option><option value="1">1. Präferenz</option><option value="2">2. Präferenz</option><option value="3">3. Präferenz</option></select></div></div>
      {surveys.map((survey) => <details className="survey-panel" key={survey.id} open={openSurvey === survey.id} onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) setOpenSurvey(survey.id); }}><summary><span><strong>{survey.title}</strong><small>{survey.responses.length} Rückmeldung(en) · {survey.active ? 'aktiv' : 'geschlossen'}</small></span><span className="summary-actions"><a className="button secondary compact" href={`/api/qr?slug=${survey.slug}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>QR-Code</a><button type="button" className="button secondary compact" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/${survey.slug}`).then(() => alert('Link kopiert.')); }}>Link kopieren</button></span></summary>
        <div className="survey-tools"><span className={`status ${survey.active ? 'active' : ''}`}>{survey.active ? 'Annahme offen' : 'Annahme geschlossen'}</span><button className="text-button" onClick={() => changeSurvey(survey.id, { active: !survey.active })}>{survey.active ? 'Schließen' : 'Wieder öffnen'}</button><button className="text-button danger-text" onClick={() => changeSurvey(survey.id, { delete: true })}>Löschen</button></div>
        {survey.responses.length === 0 ? <p className="empty">Noch keine Rückmeldungen eingegangen.</p> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Präferenzen</th><th>Eigener Vorschlag</th><th>Nachricht</th></tr></thead><tbody>{survey.responses.filter((response) => filteredResponses.some((item) => item.id === response.id)).map((response) => <tr key={response.id}><td><strong>{response.name}</strong><small>{new Date(response.createdAt).toLocaleDateString('de-DE')}</small></td><td>{response.preferences.map((pref) => { const slot = survey.slots.find((item) => item.id === pref.slotId); return slot ? <div className="preference-line" key={pref.slotId}><span className="badge">{pref.rank}. Wahl</span> {dateLabel(slot.date)} · {slot.start}–{slot.end}</div> : null; })}</td><td>{response.alternate || '—'}</td><td className="message-cell">{response.message || '—'}</td></tr>)}</tbody></table></div>}
      </details>)}
      {surveys.length === 0 && <p className="empty">Erstellen Sie links Ihre erste Terminserie.</p>}
    </section>
    <footer className="footer">Bitte prüfen und löschen Sie Rückmeldungen nach Ablauf Ihrer Aufbewahrungsfrist.</footer>
  </main>;
}
