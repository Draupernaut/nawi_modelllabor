# NaWi-Modelllabor

Offene Sammlung interaktiver Modelle für den Chemie- und Biologieunterricht.

## Leitidee

- **Unterricht zuerst:** Demonstrieren, experimentieren, auswerten.
- **Modellbewusstsein:** Annahmen und Grenzen sind Teil jedes Modells.
- **Keine Schülerkonten:** Die Modelle sollen ohne Anmeldung nutzbar sein.
- **Simple Surface, Deep Model:** verständliche Oberfläche, fachlich nachvollziehbare Modelllogik.
- **Offen, aber kontrolliert:** Beiträge sind willkommen; Veröffentlichung erfolgt über Review.

## Architektur

Die Startseite lädt nur den kleinen Modellkatalog. Einzelne Modelle werden erst geöffnet, wenn sie ausgewählt werden. Dadurch wächst die Bibliothek, ohne dass 50 oder 100 Simulationen gleichzeitig geladen werden.

```text
nawi_modelllabor/
├─ index.html
├─ catalog.json
├─ assets/                 # gemeinsame Oberfläche
├─ models/
│  ├─ chemie/<slug>/       # eigenständige Modelle
│  ├─ biologie/<slug>/
│  └─ _template/           # Vorlage für Beiträge
├─ scripts/validate.mjs    # Katalog- und Sicherheits-Checks
├─ .github/                # PR- und Issue-Workflow
└─ docs/                   # Maintainer-Dokumentation
```

## Aktueller Startbestand

Das bereits existierende Modell **Dynamisches chemisches Gleichgewicht** ist als erstes Modul im Katalog verlinkt. Es kann später vollständig in dieses Repository migriert werden, ohne den bestehenden öffentlichen Link sofort abzuschalten.

## Lokal testen

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000` öffnen.

Validierung:

```bash
npm run validate
```

## Beiträge

Siehe [CONTRIBUTING.md](CONTRIBUTING.md).

## Lizenzen

Gemischte Lizenzierung: Programmcode MIT, redaktionelle/didaktische Inhalte CC BY-SA 4.0. Details in [LICENSES.md](LICENSES.md).
