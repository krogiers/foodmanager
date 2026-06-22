# Deployment via Railway

De applicatie wordt gehost op Railway: Spring Boot als Docker container, PostgreSQL als managed addon. We kozen voor Railway boven een VPS (Hetzner, DigitalOcean) of eigen server omdat de bakkerij nul ops-werk mag hebben — geen server patchen, backups configureren of SSL beheren. Railway handelt dit allemaal af. De kostprijs (±$10/maand) is verwaarloosbaar voor een bedrijf. De React frontend wordt geserved door Spring Boot zelf, zodat er geen aparte static hosting nodig is.

## Considered Options

- **Hetzner VPS** — goedkoper, maar vereist ops-kennis en onderhoud
- **Eigen server** — gratis infra, maar beschikbaarheid en beveiliging zijn een risico
- **Railway** — gekozen; zero-ops, managed PostgreSQL, HTTPS automatisch
