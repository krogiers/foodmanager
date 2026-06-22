# Uniform ProductStock voor alle producten

Elk afgewerkt product — taart, koekje, ijs — gaat altijd door ProductStock, ook al is het op bestelling gemaakt en wordt het dezelfde dag afgehaald. We hebben bewust geen onderscheid gemaakt tussen "op bestelling" en "batch" producten op stockniveau. Het uniforme systeem (gemaakt → in stock → afgehandeld → uit stock) is eenvoudiger te begrijpen en te onderhouden dan twee parallelle modellen. "Op bestelling" beschrijft de commerciële realiteit, niet de stocklogica.

## Considered Options

- **Enkel IngredientStock voor op-bestellingproducten** — twee parallelle modellen voor tekortdetectie en stockcorrectie, meer complexiteit
- **Uniform ProductStock** — gekozen; één model, zelfde flow voor alles
