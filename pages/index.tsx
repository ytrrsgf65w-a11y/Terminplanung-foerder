import Link from 'next/link';

export default function Home() {
  return <main className="container narrow"><section className="hero">
    <div className="brand-mark">TF</div>
    <h1>Förderplangespräche einfach abstimmen</h1>
    <p>Wählen Sie einen passenden Gesprächstermin aus den Vorschlägen. Ihre Rückmeldung bleibt vertraulich.</p>
    <Link className="button primary" href="/dashboard">Zur Verwaltung</Link>
  </section></main>;
}
