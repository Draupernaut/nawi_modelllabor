# Sicherheit

## Was ein öffentliches Repository bedeutet

Öffentlich bedeutet: Quellcode darf angesehen und – im Rahmen der Lizenz – kopiert werden. Es bedeutet **nicht**, dass fremde GitHub-Nutzer Dateien im Originalrepository verändern können.

## Schreibrechte

Direkte Schreibrechte sollen nur wenige Maintainer erhalten. Externe Beiträge erfolgen über Forks und Pull Requests.

## Veröffentlichungsweg

`main` ist der Veröffentlichungszweig. Empfohlen wird ein GitHub-Ruleset, das direkte Änderungen blockiert und Pull Requests verlangt. Die exakten Einstellungen stehen in `docs/MAINTAINER_SETUP.md`.

## Modelle

Modelle sollen keine Schülerkonten, Tracker, Werbung oder unnötige externe Netzwerkverbindungen enthalten. Der CI-Check erkennt einige einfache Risikomuster; er ersetzt **kein menschliches Code-Review**.

## Sicherheitsproblem melden

Bitte keine realen Zugangsdaten oder personenbezogenen Daten in Issues veröffentlichen. Bei einem echten Sicherheitsproblem den Repository-Maintainer direkt über GitHub kontaktieren.
