# Maintainer-Setup

## 1. GitHub Pages
Repository → **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/(root)**

Öffentliche URL bei diesem Repository-Namen:
`https://draupernaut.github.io/nawi_modelllabor/`

## 2. Schutz für `main`
Unter **Settings → Rules → Rulesets** ein Branch-Ruleset für `main` anlegen.

Empfohlen:
- Require a pull request before merging
- mindestens 1 Approval, sobald mehr als ein Maintainer vorhanden ist
- Require status checks to pass → `validate`
- Block force pushes
- Restrict deletions
- Require conversation resolution

Für die frühe Einzelentwicklungsphase kann der Repository-Owner Änderungen notfalls noch direkt übernehmen. Sobald externe Beiträge beginnen, direkte Änderungen an `main` konsequent vermeiden.

## 3. Rechte
- Externen Beitragenden **keine** Write-Rechte geben.
- Standardweg: Fork → Branch → Pull Request.
- Maintainer-Zahl klein halten und 2FA für Maintainer aktivieren.

## 4. Review vor Merge
- Fachliche Aussage korrekt?
- Modellgrenzen sichtbar?
- Keine Tracker / Werbung / unnötige Netzwerkaufrufe?
- Nutzungsrechte aller Medien geklärt?
- Touch-Bedienung und kleine Displays geprüft?
- Pause / Reset bei zeitabhängigen Simulationen?
- `npm run validate` erfolgreich?
