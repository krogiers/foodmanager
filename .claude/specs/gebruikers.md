# Spec: Gebruikers & Toegangsbeheer

> Status: concept — nog te verfijnen

## Doel
Gebruikers moeten inloggen om de beheersapplicatie te gebruiken. Elke gebruiker heeft een rol die bepaalt wat ze kunnen raadplegen en bewerken.

## Entiteit

| Veld | Type | Beschrijving |
|------|------|-------------|
| id | UUID | |
| naam | String | |
| email | String | uniek, wordt gebruikt als login |
| rol | Rol | bepaalt toegang |
| actief | Boolean | inactieve gebruikers kunnen niet inloggen |

### Rollen

Toegang wordt bepaald door een vooraf gedefinieerde rol. Een gebruiker heeft precies één rol.

| Rol | Beschrijving |
|-----|-------------|
| `ADMIN` | Volledige toegang tot alle modules, inclusief gebruikersbeheer en instellingen |
| `PRODUCTIEBEHEERDER` | Beheer van het productieproces: ingrediënten, recepten, producten, labels en stock |
| `PLANNER` | Beheer van klanten en reservaties; stock enkel raadplegen |
| `MAGAZIJNIER` | Enkel stockbeheer (raadplegen én aanpassen) |

#### Module-toegang per rol

| Module | ADMIN | PRODUCTIEBEHEERDER | PLANNER | MAGAZIJNIER |
|--------|:-----:|:-----------------:|:-------:|:-----------:|
| Gebruikersbeheer | ✓ | | | |
| Instellingen (bv. provider) | ✓ | | | |
| Ingrediënten | ✓ | ✓ | | |
| Recepten | ✓ | ✓ | | |
| Producten | ✓ | ✓ | | |
| Labels | ✓ | ✓ | | |
| Stock | ✓ | ✓ | lezen | ✓ |
| Klanten | ✓ | | ✓ | |
| Reservaties | ✓ | | ✓ | |

> Toegang tot een module betekent volledig beheer (lezen + schrijven + verwijderen) tenzij anders aangegeven.
> Deze rolindeling is een voorstel — te verfijnen door de ADMIN via gebruikersbeheer.

## Authenticatie

- Gebruikers loggen in met **email + wachtwoord**
- Backend geeft een **JWT-token** terug bij succesvolle login
- Token wordt meegestuurd bij elke API-aanroep (Authorization header)
- Token vervalt na een configureerbare periode (bv. 8 uur)
- Bij verlopen token → automatisch uitloggen + redirect naar loginpagina
- Meerdere actieve sessies per gebruiker zijn toegelaten (bv. laptop + gsm tegelijk)

### Sessies intrekken

Actieve sessies kunnen worden ingetrokken ("overal uitloggen"):
- **Gebruiker zelf**: kan alle eigen actieve sessies beëindigen via profielinstellingen
- **Admin**: kan alle actieve sessies van een specifieke gebruiker beëindigen (bv. bij verlies van toestel of ontslag)

**Implementatie:** JWT is van zichzelf stateless en kan niet worden ingetrokken. Daarom bewaren we per gebruiker een `tokenVersie` in de database. Bij elke API-aanroep wordt de versie in het token vergeleken met de versie in de DB. "Overal uitloggen" verhoogt de versie → alle bestaande tokens worden ongeldig.

## Autorisatie

- **ADMIN**: heeft toegang tot alles, zonder uitzondering
- **GEBRUIKER**: ziet enkel de modules/acties waartoe ze rechten hebben; niet-toegankelijke zaken zijn niet zichtbaar in de navigatie
- Rechten worden gecontroleerd op **backend** (Spring Security) én **frontend** (routes/componenten verborgen)

## Gebruikersbeheer (enkel ADMIN)

- Gebruiker aanmaken
- Gebruiker wijzigen (naam, email, rol)
- Gebruiker deactiveren (geen harde delete — historiek blijft bewaard)
  - Inactieve gebruiker kan **niet meer inloggen**
  - Deactiveren verhoogt automatisch de `tokenVersie` → alle actieve sessies worden onmiddellijk ongeldig
- Gebruiker opnieuw activeren
- Alle sessies van een gebruiker beëindigen (zonder te deactiveren)

## Profielinstellingen (eigen gebruiker)

- Eigen wachtwoord wijzigen
- Alle eigen actieve sessies beëindigen ("overal uitloggen")

## Open vragen
- [ ] Wachtwoord-reset via email (self-service)?
- [ ] Twee-factor authenticatie (2FA)?
