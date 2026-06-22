# FoodManager

Beheersapplicatie voor recepten, producten, reservaties, stock en labels.

## Vereisten

- JDK 21
- Node.js 18+ (voor de frontend)
- Gradle (of gebruik de meegeleverde `./gradlew`)

## Applicatie starten (ontwikkeling)

Start backend en frontend elk in een apart terminalvenster.

**Terminal 1 — backend:**
```bash
./gradlew bootRun
```
Backend start op `http://localhost:8080`.  
Flyway voert automatisch de databasemigraties uit bij het opstarten.  
De database wordt opgeslagen in `./data/foodmanager.mv.db` (H2 file-modus, blijft bewaard tussen herstarts).

**Terminal 2 — frontend:**
```bash
cd frontend
npm install   # enkel eerste keer of na package-wijzigingen
npm run dev
```
Frontend start op `http://localhost:5173` en proxyt API-aanroepen naar de backend.

### H2 Console

Bekijk de database live via `http://localhost:8080/h2-console`:

| Veld | Waarde |
|------|--------|
| JDBC URL | `jdbc:h2:file:./data/foodmanager` |
| Gebruikersnaam | `sa` |
| Wachtwoord | *(leeg)* |

## Testen

```bash
./gradlew test                                                        # alle tests
./gradlew test --tests "be.foodmanager.ingredient.IngredientServiceTest"  # één klasse
```

Tests gebruiken H2 in-memory — geen aparte database vereist.

## Productie (PostgreSQL)

Vervang de datasource config in `src/main/resources/application.yml` (zie commentaar onderaan dat bestand) en zet de volgende omgevingsvariabelen:

| Variabele | Beschrijving |
|-----------|-------------|
| `DB_USERNAME` | PostgreSQL gebruikersnaam |
| `DB_PASSWORD` | PostgreSQL wachtwoord |

PostgreSQL database aanmaken:
```sql
CREATE DATABASE foodmanager;
CREATE USER foodmanager WITH PASSWORD 'foodmanager';
GRANT ALL PRIVILEGES ON DATABASE foodmanager TO foodmanager;
```
