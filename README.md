# NaWi-Modelllabor

Offene Sammlung interaktiver Modelle für den **Chemie-, Biologie- und Physikunterricht**.

## Leitidee

Das NaWi-Modelllabor soll PhET nicht ersetzen. Es ergänzt vorhandene Angebote dort, wo für eine konkrete Unterrichtssituation ein kleineres, gezielter steuerbares oder didaktisch anders aufgebautes Modell sinnvoll ist.

- **Unterricht zuerst:** Demonstrieren, experimentieren, auswerten.
- **Ein Modell – eine zentrale Idee:** lieber fokussiert als mit Funktionen überladen.
- **Modellbewusstsein:** Annahmen und Grenzen sind Teil jedes Modells.
- **Keine Schülerkonten:** Modelle sind ohne Anmeldung nutzbar.
- **Simple Surface, Deep Model:** verständliche Oberfläche, fachlich nachvollziehbare Modelllogik.
- **Offen, aber kontrolliert:** Beiträge sind willkommen; Veröffentlichung erfolgt über Review.

## Aktueller Bestand

Einsatzbereit sind derzeit:

- Dynamisches chemisches Gleichgewicht
- Reaktionsgeschwindigkeit & Kollisionen
- Aktionspotenzial am Neuron
- Newtons Kanone

Weitere Modelle werden bewusst nur dann ergänzt, wenn sie im Unterricht einen erkennbaren Mehrwert gegenüber bereits guten vorhandenen Simulationen bieten.

## Architektur

Die Startseite lädt nur den kleinen Modellkatalog. Einzelne Modelle werden erst geöffnet, wenn sie ausgewählt werden. Dadurch wächst die Bibliothek, ohne dass alle Simulationen gleichzeitig geladen werden.

~~~text
nawi_modelllabor/
├─ index.html
├─ catalog.json
├─ assets/                 # gemeinsame Oberfläche
├─ models/
│  ├─ chemie/<slug>/       # eigenständige Modelle
│  ├─ biologie/<slug>/
│  ├─ physik/<slug>/
│  └─ _template/           # Vorlage für Beiträge
├─ scripts/validate.mjs    # Katalog- und Sicherheits-Checks
├─ .github/                # PR- und Issue-Workflow
└─ docs/                   # Maintainer-Dokumentation
~~~

Filterzustände der Startseite werden in der URL gespeichert. Dadurch können Lehrkräfte direkt eine gefilterte Ansicht teilen, etwa nur Chemie oder nur einsatzbereite Modelle einer Klassenstufe.

## Lokal testen

~~~bash
python3 -m http.server 8000
~~~

Danach `http://localhost:8000` öffnen.

Validierung:

~~~bash
npm run validate
~~~

## Beiträge

Siehe [CONTRIBUTING.md](CONTRIBUTING.md).

## Lizenzen

Gemischte Lizenzierung: Programmcode MIT, redaktionelle/didaktische Inhalte CC BY-SA 4.0. Details in [LICENSES.md](LICENSES.md).
