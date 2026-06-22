# Spec: Ingrediënten

> Status: concept — nog te verfijnen

## Doel
Beheer van basisingrediënten die gebruikt worden in recepten.

## Entiteit

| Veld | Type | Beschrijving |
|------|------|-------------|
| id | UUID | |
| naam | String | uniek |
| eenheid | Eenheid | g, ml, st, kg, l |
| aankoopprijs | BigDecimal? | prijs per eenheid — gebruikt voor foodcostberekening van producten |
| voedingswaarden | VoedingswaardePer100 | per 100g of 100ml |

### Voedingswaarden (per 100g/ml)
- energie (kcal)
- eiwitten (g)
- koolhydraten (g)
  - waarvan suikers (g)
- vetten (g)
  - waarvan verzadigd (g)
- vezels (g)
- zout (g)

## Gedrag
- Ingrediënt aanmaken
- Ingrediënt wijzigen
- Ingrediënt verwijderen (alleen als niet gebruikt in een recept)
- Lijst opvragen (met zoekfilter op naam)
- Detail opvragen

## Voedingswaarden ophalen via externe voedingsdatabank

Voedingswaarden worden standaard **niet manueel ingevoerd** maar opgezocht via een externe voedingsdatabank.

### Flow
1. Gebruiker typt naam van het ingrediënt
2. Systeem zoekt via de actieve provider en toont resultaten
3. Gebruiker selecteert het juiste ingrediënt
4. Voedingswaarden worden automatisch ingevuld en **lokaal opgeslagen**
5. Gebruiker kan waarden achteraf manueel corrigeren indien nodig
6. Bij het niet vinden van de voedingswaarden krijgt de gebruiker een melding en kan deze alsnog volledig manueel ingevuld worden.

De externe bron wordt enkel aangesproken bij het zoeken — niet bij elke berekening.

### Provider-architectuur (strategy pattern)

De actieve provider wordt **in de database opgeslagen** zodat schakelen geen herstart vereist.

```
NutritionProvider (interface)
  ├── search(query: String): List<NutritionSearchResult>
  └── fetchDetail(externalId: String): VoedingswaardePer100

Implementaties:
  ├── OpenFoodFactsProvider   ← standaard
  └── EdamamProvider          ← toekomstig voorbeeld

NutritionProviderRegistry
  └── houdt alle beschikbare implementaties bij (Spring beans)

Instellingen (opgeslagen in DB):
  └── actieve provider: "OPEN_FOOD_FACTS" | "EDAMAM" | ...

NutritionProviderService
  └── leest actieve provider uit DB bij elke aanroep
  └── delegeert naar de juiste implementatie via registry
```

Schakelen van provider: instelling aanpassen in de beheersmodule → onmiddellijk actief, geen herstart.

## Allergenen

Allergenen worden **mee opgehaald uit de externe voedingsdatabank** bij het selecteren van een ingrediënt.

### Entiteit
```
Allergeen
  └── code: EU-14 allergenen (GLUTEN, SCHAALDIEREN, EIEREN, VIS, PINDA, SOJA,
                               MELK, NOTEN, SELDERIJ, MOSTERD, SESAM,
                               SULFIET, LUPINE, WEEKDIEREN)
  └── naam: leesbare naam (bv. "Gluten", "Melk")
  └── aanwezig: BEVAT | KAN_BEVATTEN | VRIJ_VAN
```

### Gedrag
- Bij ophalen uit externe bron: allergenen worden automatisch ingevuld
- Gebruiker kan allergenen achteraf manueel aanpassen/aanvullen
- Allergenen worden lokaal opgeslagen samen met het ingrediënt

### Gebruik
- Allergenen van een recept = unie van allergenen van alle ingrediënten (recursief)
- Worden later gebruikt op het **label** (zie `labels.md`)
