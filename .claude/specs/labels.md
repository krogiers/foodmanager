# Spec: Labels

> Status: concept — nog te verfijnen

## Doel
Gebruikers kunnen zelf labelsjablonen ontwerpen. Bij het afdrukken kies je welk sjabloon je gebruikt. Het formaat en de lay-out worden bepaald door het ontwerp, niet door de applicatie.

## Twee concepten

### 1. Labelsjabloon (ontwerp)
Een herbruikbaar, benaamd ontwerp dat de gebruiker zelf opmaakt.

| Veld | Type | Beschrijving |
|------|------|-------------|
| id | UUID | |
| naam | String | bv. "Standaard etiket", "Klein flesje", "Kerst 2025" |
| formaat | Formaat | breedte × hoogte in mm (vrij in te stellen) |
| logo | Afbeelding? | optioneel logo of huisstijlelement |
| lay-out | Ontwerp | positie en stijl van de dynamische velden |

#### Dynamische velden in een sjabloon
De gebruiker plaatst deze velden vrij in het ontwerp:
- Productnaam
- Ingrediëntenlijst
- Voedingswaardentabel (per 100g / per portie)
- Allergenen (BEVAT / KAN BEVATTEN)
- Houdbaarheidsdatum
- Naam van de producent
- Logo

### 2. Afdruk
Bij het afdrukken combineert het systeem een sjabloon met de gegevens van een product:
- Gebruiker kiest welk sjabloon te gebruiken
- Dynamische velden worden automatisch ingevuld vanuit het product/recept
- Gegenereerd als PDF

## Gedrag
- Labelsjabloon aanmaken, benoemen, wijzigen, verwijderen
- Sjabloon visueel ontwerpen (velden slepen, formaat instellen, logo uploaden)
- Bij afdrukken: product selecteren + sjabloon kiezen → PDF genereren
- Recept afdrukken (voor intern gebruik, apart sjabloon)

## Editor & PDF-generatie

- **Editor**: zone-gebaseerd (geen vrije canvas)
  1. Gebruiker stelt formaat in (breedte × hoogte in mm)
  2. Kiest een vooraf gedefinieerde lay-out (bv. logo bovenaan, ingrediënten links, voedingswaarden rechts)
  3. Wijst dynamische velden toe aan zones
  4. Past tekststijl per zone aan (grootte, vet, uitlijning)
- **PDF-generatie**: `@react-pdf/renderer` — exact in mm, geschikt voor labelprinters en A4

> Indien later meer vrijheid nodig: editor upgraden naar `react-konva` zonder impact op het sjabloonmodel.

## Aantal exemplaren

Bij het afdrukken geeft de gebruiker vrij op hoeveel exemplaren er nodig zijn. Alle exemplaren worden samengevoegd in één PDF.

## Houdbaarheidsdatum

Bij het aanmaken van een afdruk kiest de gebruiker per label één van drie varianten:

| Variant | Beschrijving | Voorbeeld |
|---------|-------------|---------|
| Vrije tekst | Gebruiker typt zelf een tekst | "Zie deksel", "Zie bodem" |
| Manuele datum | Gebruiker kiest een datum via datumkiezer | 15/10/2025 |
| Voorgestelde datum | Systeem berekent datum op basis van houdbaarheid uit het recept | Productiedatum + 4 maanden |

Voor de voorgestelde datum: het recept bevat een standaard houdbaarheid (in dagen, weken of maanden). Het systeem stelt de datum voor maar de gebruiker kan deze nog aanpassen voor het afdrukken.

> Zie `recepten.md` — houdbaarheid toe te voegen als veld op Recept.
