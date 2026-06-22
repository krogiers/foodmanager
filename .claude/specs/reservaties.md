# Spec: Reservaties

> Status: concept — nog te verfijnen

## Doel
Klanten reserveren producten. Beheerder heeft een kalenderoverzicht.

## Entiteit

| Veld | Type |
|------|------|
| id | UUID |
| klant | Klant |
| datum | LocalDate |
| tijdstip | LocalTime? |
| lijnen | List<ReservatieLijn> |
| status | AANGEVRAAGD / BEVESTIGD / GEANNULEERD |

### ReservatieLijn
| Veld | Type |
|------|------|
| product | Product |
| aantal | Int |

## Gedrag
- Reservatie aanmaken (door klant via website of beheerder intern)
- Reservatie bevestigen / annuleren
- Kalenderoverzicht opvragen (per dag/week/maand)
- Reservatiedetail opvragen

## Open vragen
- [ ] Levertijd of afhaling?
- [ ] Automatische bevestiging of manuele goedkeuring door beheerder?
- [ ] Meldingen (email/SMS) bij statuswijziging?
