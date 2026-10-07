# Beitragen zum NaWi-Modelllabor

Beiträge von Lehrkräften, Studierenden und anderen fachlich Interessierten sind willkommen.

## Sicherer Workflow

Niemand benötigt Schreibrechte auf `main`.

1. Repository **forken**.
2. Eigenen Branch erstellen, z. B. `model/osmose`.
3. Modell aus `models/_template/` ableiten.
4. Katalogeintrag ergänzen.
5. `npm run validate` ausführen.
6. Pull Request eröffnen.
7. Maintainer prüfen Fachlichkeit, Modellgrenzen, Bedienbarkeit und Code.
8. Erst nach Freigabe wird gemergt und damit öffentlich veröffentlicht.

## Mindestanforderungen an Modelle

- fachlich nachvollziehbare Modellannahmen;
- sichtbare Erklärung von **Modellgrenzen**;
- keine Schülerkonten oder personenbezogenen Schülerdaten;
- keine Werbung, Tracker oder Analyse-SDKs;
- keine extern nachgeladenen JavaScript-Bibliotheken ohne ausdrückliche Review-Freigabe;
- auf Touch-Geräten benutzbar;
- Pause/Reset bei zeitabhängigen Animationen;
- Zahlenwerte und Einheiten müssen didaktisch eindeutig benannt sein;
- keine übernommenen Lehrbuchgrafiken, Fotos oder Texte ohne geklärte Nutzungsrechte;
- robuste Startwerte und sinnvoller Fehlerzustand bei unzulässigen Eingaben.

## Einheitlich, aber nicht starr

Startseite, Navigation, Grundtypografie und Qualitätsstandards sind gemeinsam. Innerhalb eines Modells darf die Darstellung frei an den fachlichen Zweck angepasst werden. `assets/model-base.css` bietet einen gemeinsamen Ausgangspunkt.

## Lizenz der Beiträge

Mit einem Pull Request bestätigst du, dass du die erforderlichen Rechte an deinem Beitrag besitzt und ihn unter der für den jeweiligen Bereich angegebenen Projektlizenz bereitstellen darfst:

- Programmcode: MIT
- didaktische Texte, Aufgaben und eigene Grafiken: CC BY-SA 4.0

Bei Fremdmaterial muss die abweichende Lizenz explizit angegeben und kompatibel sein.
