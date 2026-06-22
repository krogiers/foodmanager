# Spec: Recepten

> Status: concept — nog te verfijnen

## Doel
Beheer van recepten. Een recept is een boom van ingrediënten en/of andere recepten (composite pattern).

## Entiteit

| Veld | Type | Beschrijving |
|------|------|-------------|
| id | UUID | |
| naam | String | uniek |
| regels | List<ReceptRegel> | ingrediënten of subrecepten met hoeveelheid |
| houdbaarheid | HoudbaarheidsDuur? | standaard houdbaarheid (getal + eenheid) — gebruikt bij labelgeneratie |
| voedingswaarden | berekend | afgeleid van de boom, niet opgeslagen |

### HoudbaarheidsDuur
| Veld | Type | Voorbeeld |
|------|------|-----------|
| waarde | Int | 4 |
| eenheid | DAGEN \| WEKEN \| MAANDEN | MAANDEN |

### ReceptRegel
| Veld | Type |
|------|------|
| hoeveelheid | Decimal |
| eenheid | Eenheid |
| component | Ingredient \| Recept |

## Gedrag
- Recept aanmaken
- Recept wijzigen (regels toevoegen/verwijderen/wijzigen)
- Recept verwijderen (alleen als niet gebruikt in een product of ander recept)
- Voedingswaarden berekenen (recursief over de boom)
- Lijst opvragen
- Detail opvragen

## Voedingswaarden berekening
- Recursief: voor elk ReceptRegel → hoeveelheid × voedingswaarde per eenheid
- Subrecepten worden ook recursief uitgerekend
- Resultaat is altijd afgeleid, nooit opgeslagen

## Open vragen
- [ ] Hoe gaan we om met eenheidsconversie (bv. recept in g, ingredient per 100g)?
- [ ] Maximale diepte van de boom (circular reference preventie)?
- [ ] Versioning van recepten (historiek bewaren)?
