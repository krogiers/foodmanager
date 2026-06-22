# Geen versioning van recepten

Recepten zijn levende documenten. Wijzigingen zijn onmiddellijk van kracht op alle openstaande reservaties — er worden geen snapshots of versiehistorieken bijgehouden. In een kleine artisanale bakkerij evolueren recepten continu (seizoensvariaties, prijsaanpassingen, verfijningen) en is het koppelen van een reservatie aan een bevroren receptversie overengineering. Als bescherming wordt een waarschuwing getoond wanneer een recept gewijzigd wordt terwijl het in bevestigde toekomstige reservaties zit, en verwijderen is geblokkeerd zolang dat het geval is.

## Considered Options

- **Snapshot per reservatie** — correct maar complex: recepten kloonen bij bevestiging, aparte opslagtabel, migratiestrategie
- **Versiehistoriek op recept** — flexibeler maar dezelfde complexiteit, en weinig meerwaarde voor dit gebruik
- **Geen versioning** — gekozen; bewuste keuze omwille van eenvoud en de schaal van het bedrijf
