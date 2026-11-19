import Link from 'next/link';

export default function Home() {
  return (
    <main className="container narrow">
      <section className="hero">
        <div className="brand-mark">TF</div>
        <h1>Terminplanung für Förderplangespräche</h1>
        <p>Terminoptionen erstellen, mit Eltern teilen und Rückmeldungen übersichtlich verwalten.</p>
        <Link className="button primary" href="/dashboard">Zum Dashboard</Link>
      </section>
    </main>
  );
}
