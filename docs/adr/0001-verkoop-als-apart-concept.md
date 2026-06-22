# Verkoop als apart concept naast Reservatie

Directe ijsverkoop op locatie is een fundamenteel ander verkoopmodel dan een reservatie: er is geen klant vereist, geen bevestigingsworkflow, en stock daalt onmiddellijk. We hebben dit als een apart `Verkoop`-concept gemodelleerd in plaats van een `Reservatie` zonder klant of met een speciale status. Een Reservatie is altijd vooraf gepland en klantsgebonden; een Verkoop is altijd direct en optioneel klantsgebonden. De twee mixen zou beide concepten onnodig complex maken.

## Considered Options

- **Reservatie zonder klant** — te veel uitzonderingen op de bestaande invarianten (status-workflow, tekortdetectie op basis van datum)
- **Aparte Verkoop** — gekozen; elk concept heeft zijn eigen eenvoudige model
