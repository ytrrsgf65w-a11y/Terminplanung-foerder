# Terminplanung für Förderplangespräche

Eine einfache Webanwendung zur vertraulichen Abstimmung von Gesprächsterminen mit Eltern. Eltern können nur die Terminoptionen und das Formular sehen; eingegangene Antworten sind ausschließlich im passwortgeschützten Dashboard abrufbar.

## Enthaltene Funktionen

- Terminserien mit bis zu 60 Datum-/Zeitoptionen erstellen und wieder schließen
- Eltern-Link und herunterladbaren QR-Code bereitstellen
- Eltern können bis zu drei unterschiedliche Präferenzen angeben, eine Nachricht senden oder einen Alternativtermin vorschlagen
- Geschütztes Dashboard mit Kalenderliste sowie Antwortfiltern nach Termin und Präferenz
- Rückmeldungen einer Terminserie gemeinsam löschen

## Lokal ausprobieren

Voraussetzungen: Node.js 20 oder neuer.

1. `npm install`
2. `.env.example` nach `.env` kopieren und `ADMIN_PASSWORD` durch ein langes, einzigartiges Kennwort ersetzen.
3. `npx prisma db push`
4. `npm run dev`
5. Dashboard unter `http://localhost:3000/dashboard` öffnen. Elternseiten liegen unter `http://localhost:3000/<slug>`.

Für einen erreichbaren QR-Code muss `NEXT_PUBLIC_APP_URL` auf die öffentliche HTTPS-Adresse der Anwendung gesetzt sein. `DATABASE_URL` ist bei SQLite standardmäßig `file:./dev.db`.

## Wichtiger Hinweis zum Datenschutz und Betrieb

Dies ist ein **MVP/Entwicklungsstand**, keine geprüfte oder bereits betriebene Hosting-Lösung. Es speichert Namen, Präferenzen, Nachrichten und alternative Terminvorschläge. Vor dem Einsatz mit echten Eltern müssen Sie eine geeignete Hosting- und Datenbanklösung wählen, HTTPS, Backups, Zugriffsschutz, Löschfristen und die für Ihre Einrichtung geltenden Datenschutzvorgaben prüfen. SQLite-Dateien sind bei vielen Cloud-Hostern nicht dauerhaft gespeichert; setzen Sie die Anwendung dort nicht ohne persistente Datenbank/Datenträger ein. Veröffentlichen Sie keine echten Rückmeldungen oder Zugangsdaten im Repository.

Das Kennwort wird ausschließlich als Server-Umgebungsvariable `ADMIN_PASSWORD` konfiguriert; die Login-Sitzung wird in einem HttpOnly-, SameSite-Cookie gehalten. Legen Sie die Variable nicht in den Quellcode oder in öffentliche Dateien. Für eine Live-Anwendung sind zusätzlich unter anderem Rate-Limiting, geregelte Backups/Löschung und eine Datenschutzprüfung erforderlich.
