# Spec: Producten

> Status: concept — nog te verfijnen

## Doel
Een product is wat een klant reserveert. Het bestaat uit één of meerdere recepten.

## Entiteit

| Veld | Type | Beschrijving |
|------|------|-------------|
| id | UUID | |
| naam | String | uniek |
| recepten | List<ProductRecept> | recepten waaruit het product is samengesteld |
| verkoopprijs | BigDecimal | manueel in te stellen |
| voedingswaarden | berekend | afgeleid van de recepten |

### ProductRecept
| Veld | Type |
|------|------|
| recept | Recept |
| hoeveelheid | Decimal |
| eenheid | Eenheid |

## Foodcost & winst

| Gegeven | Herkomst | Beschrijving |
|---------|---------|-------------|
| `verkoopprijs` | Manueel | Wat de klant betaalt |
| `foodcost` | Berekend | Som van alle ingrediëntkosten recursief door de receptenboom |
| `winst` | Berekend | `verkoopprijs - foodcost` |
| `winstmarge` | Berekend | `(winst / verkoopprijs) × 100` in % |

De foodcost wordt automatisch berekend op basis van de **aankoopprijs per eenheid** van elk ingrediënt (zie `ingredienten.md` — aankoopprijs toe te voegen). Wijzigt een ingrediëntprijs, dan wijzigt de foodcost van alle producten die dat ingrediënt bevatten.

## Gedrag
- Product aanmaken
- Product wijzigen
- Product verwijderen (alleen als niet actief in reservaties)
- Voedingswaarden opvragen (berekend via recepten)
- Foodcost + winst opvragen (berekend)
- Lijst opvragen (inclusief verkoopprijs, foodcost en winstmarge)

## Open vragen
- [ ] Heeft een product een foto?
