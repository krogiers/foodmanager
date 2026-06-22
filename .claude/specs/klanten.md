# Spec: Klanten

> Status: concept — nog te verfijnen

## Doel
Beheer van klanten die producten kunnen reserveren. De klantfiche geeft de beheerder snel inzicht in de historiek en de persoonlijke context van de klant.

## Entiteit

| Veld | Type | Beschrijving |
|------|------|-------------|
| id | UUID | |
| naam | String | |
| email | String | |
| telefoon | String? | |
| adres | Adres? | |
| herkomst | Herkomst | hoe heeft de klant ons leren kennen |
| voorkeurContact | VoorkeurContact | hoe de klant gecontacteerd wil worden |
| allergieën | List<Allergeen> | EU-14 allergenen (zie `ingredienten.md`) |
| speciale eisen | List<SpecialeEis> | vrije tekst per eis |

### Herkomst
Hoe de klant ons heeft leren kennen. Voorbeelden (uitbreidbaar):
- MOND_TOT_MOND
- SOCIALE_MEDIA
- WEBSITE
- EVENT
- ANDERE (met vrij tekstveld)

### VoorkeurContact
Hoe de klant gecontacteerd wil worden:
- EMAIL
- TELEFOON
- SMS
- WHATSAPP
- FACEBOOK
- MESSANGER
- INSTAGRAM

### SpecialeEis
Persoonlijke wensen of vereisten die bij elke reservatie relevant kunnen zijn.

| Veld | Type | Voorbeeld |
|------|------|-----------|
| omschrijving | String | "Geen varkensvlees", "Halal", "Lactosevrij" |

## Bestellingshistoriek

Via de reservaties (zie `reservaties.md`) kan per klant worden opgezocht:
- Wanneer er besteld werd (datum)
- Welke producten besteld werden
- In welke hoeveelheid

Dit is **geen aparte opslag** — dit wordt afgeleid van de bestaande reservaties gekoppeld aan de klant.

## Gedrag
- Klant aanmaken (intern door beheerder + zelfregistratie via website)
- Klant wijzigen
- Klant opvragen met:
  - contactgegevens
  - allergieën en speciale eisen
  - herkomst
  - bestellingshistoriek (gesorteerd op datum, recentste eerst)
- Klant verwijderen (enkel als geen actieve reservaties)

## GDPR

### Rechtsgrond
- Uitvoering van een overeenkomst (reservatie) → contactgegevens, bestellingshistoriek
- Toestemming (opt-in) → communicatievoorkeuren, marketing

### Bewaartermijn
- Persoonsgegevens worden bewaard zolang er een actieve klantrelatie is
- Na **3 jaar zonder activiteit** (geen reservatie): klant wordt **geanonimiseerd**
- Boekhoudkundige gegevens (bedragen, facturen) blijven 7 jaar bewaard conform wetgeving, maar zonder link naar persoonsgegevens

### Anonimisering (geen harde delete)
Bij verwijdering of het verstrijken van de bewaartermijn worden persoonsgegevens **geanonimiseerd**, niet gewist. Zo blijft de bestellingshistoriek intact voor interne rapportage:
- naam → `[Geanonimiseerde klant]`
- email, telefoon, adres → leeggemaakt
- allergieën, speciale eisen → verwijderd
- herkomst, voorkeurContact → verwijderd

### Rechten van de klant
- **Inzage**: klant kan zijn gegevens opvragen
- **Correctie**: klant kan gegevens laten aanpassen
- **Vergetelheid**: klant kan anonimisering aanvragen → zelfde flow als bewaartermijn
- **Overdraagbaarheid**: export van eigen gegevens (JSON of PDF)

### Gegevensminimalisatie
Enkel gegevens verzamelen die noodzakelijk zijn voor de werking van de applicatie. Allergieën en speciale eisen worden enkel verzameld met expliciete toestemming van de klant.

## Open vragen
- [ ] Authenticatie via website: eigen login of OAuth (Google/...)?
- [ ] Kunnen allergieën van de klant een waarschuwing triggeren bij het aanmaken van een reservatie met een product dat dat allergeen bevat?
