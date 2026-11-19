# Terminplanung für Förderplangespräche

Eine datenschutzbewusste Webanwendung zur Abstimmung von Förderplangesprächen.

## Funktionen

- Terminoptionen anlegen
- Öffentlichen Formularlink und QR-Code erzeugen
- Bis zu drei Terminpräferenzen erfassen
- Eigene Terminvorschläge und Nachrichten erlauben
- Geschütztes Dashboard mit Kalenderübersicht
- Antworten nach Datum und Präferenz filtern
- Individuelle Rückmeldungen löschen

## Lokale Einrichtung

1. Node.js 20 oder neuer installieren.
2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
3. Umgebungsdatei anlegen:
   ```bash
   cp .env.example .env
   ```
4. Datenbank erstellen:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Anwendung starten:
   ```bash
   npm run dev
   ```

Die Anwendung läuft anschließend unter `http://localhost:3000`.

## Umgebungsvariablen

```env
DATABASE_URL="file:./dev.db"
ADMIN_TOKEN="ein-langes-zufaelliges-geheimes-passwort"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Das Admin-Kennwort wird nur im Browser für API-Anfragen verwendet und darf nicht an Eltern weitergegeben werden.

## Datenschutz

Die Anwendung speichert Namen, Termine, Präferenzen, Nachrichten und alternative Vorschläge in der konfigurierten Datenbank. Es werden keine Antworten zwischen Eltern sichtbar gemacht. Bitte richten Sie auf dem produktiven Server eine Löschroutine nach Ihren Datenschutzrichtlinien ein und verwenden Sie HTTPS.
