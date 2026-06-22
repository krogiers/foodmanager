# CONTEXT.md — FoodManager

Gedeelde taal voor het FoodManager-domein. Geen implementatiedetails — enkel begrippen en hun betekenis.

## Bedrijfscontext

**Ambachtelijke bakkerij** die taarten, koekjes, ijs, ijspralines, bokkenpootjes en macarons maakt.
Producten worden **altijd op bestelling** gemaakt — nooit kant-en-klaar voor doorloop.
Klanten **halen af** op een afgesproken tijdstip; levering is mogelijk tegen meerprijs.

---

## Begrippen

### Reservatie
Een bestelling van een klant. Heeft altijd één van vier statussen:
- **AANGEVRAAGD** — ingediend via de website door de klant zelf; wacht op beoordeling door de beheerder
- **BEVESTIGD** — goedgekeurd (automatisch bij intern aanmaken door beheerder, manueel bij online aanvraag)
- **AFGEHANDELD** — product overhandigd aan de klant (afhaling of levering); beheerder tekt manueel af; ProductStock daalt op dit moment
- **GEANNULEERD** — geannuleerd door klant of beheerder; vanuit elke status mogelijk

Bevat een datum, tijdstip, en leveringstype.

### LeveringsType
Bepaalt hoe een bestelling bij de klant terechtkomt. Twee opties:
- **AFHALING** — klant haalt zelf af op afgesproken datum/tijdstip
- **LEVERING** — gehele bestelling wordt geleverd op een adres, met een manueel in te geven meerprijs

> Levering is alles-of-niets per reservatie: niet per product.

### ReservatieLijn
Eén regel binnen een reservatie: een product met een aantal, en een optioneel `opmerkingen`-veld voor klantspecifieke wensen (bv. "naam 'Hilde' op de taart", "glutenvrij alternatief"). Aanpassingen zijn notities — geen aparte domeinlogica.

### Product
Een benoemd, verkoopbaar artikel dat uit één of meerdere recepten is samengesteld. Dient als sjabloon voor wat een klant kan bestellen — niet als een unieke, klantspecifieke instantie.

### Recept
Een boom van ingrediënten en/of subrecepten (composite pattern). Voedingswaarden worden altijd berekend, nooit opgeslagen. Cirkels (recept A gebruikt recept B dat recept A gebruikt) worden geblokkeerd bij het opslaan. Recepten zijn levende documenten — geen versiehistoriek. Wijzigingen zijn meteen van kracht op alle openstaande reservaties, met een waarschuwing als het recept in bevestigde toekomstige reservaties zit.

### Conversiefactor
Een optioneel gewicht-per-stuk op een ingrediënt met eenheid "st" (bv. "1 ei = 60g"). Gebruikt bij het berekenen van voedingswaarden in een recept. Als de conversiefactor ontbreekt, zijn de voedingswaarden van dat ingrediënt onvolledig — het systeem toont dan een waarschuwing.

### Opbrengst
Het gewicht of volume dat een recept oplevert (bv. "800g chocolademousse"). Optioneel veld op een Recept. Nodig om voedingswaarden correct te berekenen wanneer het recept als subrecepten gebruikt wordt. Ontbreekt de opbrengst, dan markeert het systeem de voedingswaarden als onvolledig.

### Ingredient
Een basisgrondstof met een naam, eenheid en voedingswaarden per 100g/ml.

### Klant
Een persoon met contactgegevens, allergieën en speciale eisen die producten reserveert.

### VoorkeurContactwijze
Een notitie op de klantfiche die aangeeft hoe de beheerder de klant het best bereikt (bv. "liever bellen dan mailen"). Geen trigger voor automatische meldingen — dit is informatie voor de beheerder.

Mogelijke waarden: EMAIL, TELEFOON, SMS, WHATSAPP, FACEBOOK, MESSENGER, INSTAGRAM.

### Automatische melding
Meldingen die het systeem zelf verstuurt bij statuswijzigingen van een reservatie. Enkel via **email**. Andere kanalen zijn een handmatige actie van de beheerder op basis van de VoorkeurContactwijze.

### Allergenenwarschuwing
Een niet-blokkerende melding bij het aanmaken van een reservatie wanneer een product een allergeen bevat dat de klant heeft vermeld. De beheerder beslist zelf of hij doorgaat — het systeem blokkeert niet.

### Verkoop
Een directe transactie op locatie, zonder voorafgaande reservatie. Gebruikt bij het venten met ijs. Heeft geen statusflow — wordt meteen geregistreerd als afgehandeld.

Bevat: datum + tijdstip, locatie (vrije tekst of adres), verkooplijnen (product + aantal), en optioneel een gekende klant.

Verschilt van een Reservatie: de klant is niet altijd gekend, er is geen bevestigingsworkflow, en stock wordt onmiddellijk afgetrokken (niet proactief berekend).

### Klantherkenning op locatie
Hulpfunctie bij een Verkoop: zoek geregistreerde klanten die wonen in de buurt van de huidige locatie. Geen apart domeinbegrip — een zoekquery op het adresveld van Klant.

### Verpakking
Een apart stockitem volledig los van Product en Recept. Voorbeelden: dozen, zakjes, linten, stickers. Eenheid is altijd stuks. Heeft een herbestelniveau en valt onder dezelfde Stockcorrectie-logica als ingrediënten. De keuze van verpakking per bestelling is een manuele beslissing van de bakker op het moment van inpakken — het systeem legt geen link tussen een Verpakking en een Product.

### Leverancier
Buiten scope — stockbeheer is volledig manueel. Beheerder verhoogt de IngredientStock manueel wanneer een levering binnenkomt. Geen integratie met externe leverancierssystemen.

### Publieke bestelpagina
Toekomstige fase. Klanten maken zelf een account aan en dienen reservatieaanvragen in. Buiten scope van de huidige bouw — eerst de beheersapplicatie volledig uitwerken.

### Label
Een afdruk van een sjabloon gecombineerd met de gegevens van een product (ingrediëntenlijst, voedingswaarden, allergenen, houdbaarheidsdatum).

### Stock
Uniform systeem met twee niveaus:
- **IngredientStock** — voorraad grondstoffen; stijgt bij aankoop, daalt bij productie
- **ProductStock** — voorraad afgewerkte producten; stijgt bij productieregistratie, daalt bij afhaling of levering

Elk product — of het nu ijs of een taart is — volgt hetzelfde patroon: gemaakt → in stock → geleverd/afgehaald → uit stock. "Op bestelling" betekent enkel dat de tijd in stock kort is.

### Productieregistratie
De handeling waarbij de bakker aangeeft dat een aantal eenheden van een product klaar zijn. Verhoogt de ProductStock en verlaagt de IngredientStock met de benodigde hoeveelheden op basis van het recept.

### Stockcorrectie
Een manuele aanpassing van IngredientStock of ProductStock met een verplichte reden. Redenen: `BEDERF`, `KWALITEITSFOUT`, `ONGELUK`, `INVENTARISATIE`, `ANDERE` (met optionele vrije notitie). Geeft inzicht in verliespatronen over tijd.

### Herbestelniveau
Een optionele minimumhoeveelheid per ingrediënt. Wanneer de IngredientStock eronder zakt, toont het systeem een waarschuwing — ongeacht openstaande reservaties. Aanvullend op de tekortdetectie.

### Tekortdetectie
Proactieve berekening per periode: voor bevestigde reservaties, controleer ProductStock eerst (al gemaakt?), dan IngredientStock (kunnen we nog maken?). Signaleert tekort als noch stock noch ingrediënten voldoende zijn.
