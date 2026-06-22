# Spec: Stockbeheer

> Status: verfijnd

## Doel
Bijhouden van voorraad op ingrediënt-, product- en verpakkingsniveau. Proactief detecteren van stockbreuk op basis van geplande reservaties.

## Entiteiten

### IngredientStock
| Veld | Type | Beschrijving |
|------|------|-------------|
| ingredient | Ingredient | |
| hoeveelheid | Decimal | |
| eenheid | Eenheid | |
| herbestelniveau | Decimal? | Optionele minimumdrempel — waarschuwing als stock eronder zakt |

### ProductStock
| Veld | Type | Beschrijving |
|------|------|-------------|
| product | Product | |
| aantal | Int | |

> Elk product volgt hetzelfde stockmodel — "op bestelling" of batch maakt geen verschil. Gemaakt → in stock → afgehandeld → uit stock.

### VerpakkingStock
| Veld | Type | Beschrijving |
|------|------|-------------|
| verpakking | Verpakking | bv. "Witte doos 20×20cm", "Lint goud" |
| aantal | Int | altijd in stuks |
| herbestelniveau | Int? | optionele minimumdrempel |

> Verpakkingen zijn volledig los van producten en recepten. De bakker kiest zelf welke verpakking hij gebruikt per bestelling.

## Stockcorrectie

Elke manuele aanpassing van IngredientStock, ProductStock of VerpakkingStock vereist een reden:

| Reden | Beschrijving |
|-------|-------------|
| `BEDERF` | Ingrediënt of product is vervallen |
| `KWALITEITSFOUT` | Eindproduct voldoet niet aan kwaliteitseisen |
| `ONGELUK` | Gevallen, gemorst, beschadigd |
| `INVENTARISATIE` | Correctie na telling — systeem klopt niet met werkelijkheid |
| `ANDERE` | Vrij tekstveld verplicht |

## Productieregistratie

Wanneer de bakker producten afwerkt, registreert hij dit:
- Welk product, hoeveel stuks
- IngredientStock daalt met de benodigde hoeveelheden (via het recept)
- ProductStock stijgt met het aantal gemaakte stuks

## Gedrag
- Stock opvragen (ingrediënten, producten, verpakkingen)
- Stock ophogen (levering van ingrediënten of verpakkingen binnenkomt)
- Productieregistratie (producten afgewerkt)
- Stockcorrectie (verlies, fout, inventarisatie)
- Reservatie aftekenen als AFGEHANDELD → ProductStock daalt
- **Proactieve tekortdetectie** per periode
- Herbestelniveau-waarschuwingen (ingrediënten + verpakkingen)

## Tekortdetectie logica

```
Voor elke bevestigde reservatie in periode:
  1. Check ProductStock: zijn er al genoeg afgewerkte producten?
  2. Voor resterende aantallen: check IngredientStock
     → ReservatieLijn → Product → Recepten → ReceptRegels → Ingrediënten
     → Aggregeer benodigde hoeveelheden per ingredient
     → Vergelijk met huidige stock
     → Tekort als: benodigde hoeveelheid > beschikbare stock
```

## Herbestelniveau-waarschuwingen

Los van reservaties: toon een waarschuwing wanneer IngredientStock of VerpakkingStock onder het ingestelde herbestelniveau zakt. Geeft proactief aan wat besteld moet worden.

## Leveranciers

Volledig manueel — geen integratie met externe leverancierssystemen.
