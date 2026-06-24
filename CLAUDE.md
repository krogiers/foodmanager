# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Framework:** Spring Boot (Kotlin)
- **Build:** Gradle with Kotlin DSL (`build.gradle.kts`)
- **Database:** Exposed DSL (geen JPA/Hibernate) + Flyway voor migraties
- **Foutafhandeling:** Arrow `Either<DomeinFout, T>` — geen exceptions voor domeinfouten
- **Language:** Kotlin — follow the [official Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html)

## Commands

```bash
./gradlew build          # compile + test
./gradlew bootRun        # start de applicatie
./gradlew test           # run alle tests
./gradlew test --tests "com.example.UserServiceTest"  # één testklasse
```

## Domeinmodel

```
Ingredient
  └── naam, eenheid (g/ml/st/...), voedingswaarden per eenheid

Recept  ← composite pattern
  └── ReceptRegel: Ingredient (met hoeveelheid) | Recept (met hoeveelheid)
  └── voedingswaarden worden berekend (afgeleid van regels)

Product
  └── bestaat uit 1 of meerdere Recepten (met hoeveelheid)
  └── heeft een voorraad

Klant
  └── naam, contactgegevens

Reservatie
  └── Klant
  └── ReservatieLijn: Product + aantal
  └── datum/tijdstip

Label  (per afgeleverd Product)
  └── productnaam, ingrediëntenlijst, voedingswaarden

Stock
  └── IngredientStock
  └── ProductStock
  └── tekortdetectie op basis van openstaande reservaties
```

**Architecturele beslissingen:**
- `Recept` is een composite: een recept kan ingrediënten én andere recepten bevatten
- Voedingswaarden zijn altijd berekend (nooit opgeslagen), afgeleid van de boom van ingrediënten
- Stock tekort wordt proactief berekend door reservaties te aggregeren
- Externe voedingsdatabank via **strategy pattern** (`NutritionProvider` interface): actieve provider staat in de DB, niet in config — schakelen vereist geen herstart
- **Event-driven**: services communiceren via domein-events (`ApplicationEventPublisher`), niet via directe service-naar-service calls — houdt modules ontkoppeld
- **Result-typed**: services retourneren `Either<DomeinFout, T>` (Arrow) in plaats van exceptions te gooien — expliciete foutafhandeling, geen verborgen control flow via exceptions

## Specs

Gedetailleerde specs per domein staan in `.claude/specs/`:
- `gebruikers.md` — authenticatie, rollen, toegangsbeheer
- `ingredienten.md`
- `recepten.md`
- `producten.md`
- `klanten.md`
- `reservaties.md`
- `labels.md`
- `stock.md`

## Frontend

- Beheerswebsite is gebouwd in **React**
- Styling: **Tailwind CSS** + **shadcn/ui** — consistente, toegankelijke en professioneel ogende UI
- **Meldingen en fouten**: altijd een niet-blokkerende **toast** via **Sonner** — de gebruiker wordt geïnformeerd maar kan verder werken
- **Blokkerende dialog**: enkel wanneer de spec dit expliciet vermeldt
- Standaard: toast. Uitzondering: dialog. Nooit omgekeerd.

### Lay-out
- Vaste **sidebar links** met iconen + labels per module
- **Topbar** rechts: gebruikersnaam, rol, uitlogknop
- Niet-toegankelijke modules zijn niet zichtbaar in de sidebar (op basis van rol)

### Kleurenpalet
- Neutrale basis: `slate` (shadcn/ui standaard)
- Warme accentkleur: `amber` — past bij een voedingsbedrijf
- Statuskleuren: groen (ok) / oranje (opgelet) / rood (tekort of fout)

### Navigatiepatroon — VERPLICHT voor elke module

**Geen SlideOver voor CRUD-acties. Alles op een eigen pagina.**

| Actie | Gedrag |
|-------|--------|
| "Nieuw" knop in lijst | Navigeer naar `/module/nieuw` — volwaardig aanmaakscherm |
| Dubbelklik of edit-knop in lijst | Navigeer naar `/module/:id` — volwaardig detailscherm |
| Detailscherm (view) | Breadcrumb + tabs + read-only velden via `Veld`-component |
| "Bewerken" op detailscherm | Schakelt inline naar edit-modus — zelfde layout, velden worden invoervelden |
| Opslaan/Annuleren | Terug naar view-modus op dezelfde pagina |

SlideOver (`<SlideOver>`) is **verboden** voor detail, bewerken en aanmaken. Het mag alleen voor contextuele acties zonder eigen pagina (bv. een bevestigingsdialoog of een filter-paneel).

### UI-patronen per module
| Module | Primaire weergave |
|--------|------------------|
| Alle modules | Zoekbare tabel in lijst, volwaardig detailscherm op eigen route |
| Reservaties | Kalenderweergave (week/maand) als primair, lijstweergave als alternatief |
| Stock | Tabel met kleurindicatoren voor stockniveau |
| Labels | Split-screen: editor links, preview rechts |
| Dashboard (startpagina) | Widgets: reservaties vandaag, stockwaarschuwingen, recente klanten |

### UI-details
- **Lege states**: altijd een duidelijke call-to-action, nooit een blanco pagina
- **Laden**: skeleton loaders, geen spinners
- **Diepere navigatie**: breadcrumbs tonen (bv. Recepten › Chocoladetaart)
- **Allergenen**: altijd weergeven als gekleurde badges waar relevant

## Packagestructuur

Organiseer per module (feature), niet per laag:

```
ingredient/
  Ingredient.kt          ← entiteit
  IngredientFout.kt      ← sealed class met domeinfouten
  IngredientEvent.kt     ← domein-events
  IngredientRepository.kt
  IngredientService.kt
  IngredientController.kt
  dto/                   ← aparte subfolder: request/response DTOs
  nutrition/             ← aparte subfolder: subdomain met eigen verantwoordelijkheid
```

- Bestanden binnen een module staan **plat** — geen `service/`, `repository/`, `controller/` subfolders
- Subfolders enkel als er een duidelijk **apart subdomain** is (zoals `nutrition/`) of als een module te groot wordt (>8 bestanden)

## Code conventies

- Kotlin coding conventions en style gelden altijd (naamgeving, formatting, idioms)
- Gebruik Kotlin idioms: data classes, extension functions, `?.`, `?:`, `when`, etc.
- Geen onnodige `null` checks als de compiler het al afdwingt
- Geen Java-stijl getters/setters — gebruik Kotlin properties

## Testen

- Elke klasse krijgt een bijhorende unit test
- Gebruik **DataFaker** voor testdata (nooit hardcoded strings zoals `"test"` of `"foo"`)
- Tests staan in `src/test/kotlin`, zelfde packagestructuur als de productiecode

```kotlin
// DataFaker voorbeeld
val faker = Faker()
val name = faker.name().fullName()
val email = faker.internet().emailAddress()
```

- Testnamen in backticks, beschrijvend in het Nederlands of Engels:
```kotlin
@Test
fun `returns empty list when no users exist`() { ... }
```
