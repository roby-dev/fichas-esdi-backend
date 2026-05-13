# Fichas ESDI Backend

Backend API para el sistema de **Fichas ESDI** (Escala de Desarrollo Infantil) del programa CUNAMAS — MIDIS Perú.

## Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: [NestJS](https://nestjs.com/)
- **DB**: MongoDB
- **Architecture**: Hexagonal / Clean Architecture
- **Package manager**: pnpm

## Project setup

```bash
pnpm install
```

## Environment

Copiar `.env.example` a `.env.development` o `.env.production` y configurar las variables:

| Variable | Descripción |
|---|---|
| `MONGO_URI` | URI de conexión a MongoDB |
| `JWT_SECRET` | Secreto para firmar tokens JWT |
| `JWT_EXPIRATION` | TTL del access token (ej. `15m`) |
| `REFRESH_SECRET` | Secreto para refresh tokens |
| `REFRESH_EXPIRATION` | TTL del refresh token (ej. `7d`) |

## Compile and run

```bash
# development
pnpm run start:dev

# production
pnpm run build
pnpm run start:prod
```

## Run tests

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# test coverage
pnpm run test:cov
```

## Módulos principales

| Módulo | Descripción |
|---|---|
| **Child** | CRUD de niños/as y su ficha única. Validación de ventana de admisión (19–40 días) y graduación (+35 meses). Cálculo de señales de alarma integrado. |
| **AlertChild** | Carga masiva histórica desde Excel. Datos consolidados con señales de alarma por edad. |
| **Committee** | Catálogo de comités de gestión (CRUD). |
| **CommitteeMembership** | Asignación usuario ↔ comité (admin-only). Reemplazó a `ManagementCommittee`. |
| **CommunityHall** | Locales comunales por comité (admin-only). |
| **Auth** | Login JWT, refresh tokens, cambio de contraseña. |
| **Session** | Tracking de sesiones activas por usuario. |
| **Audit** | Trazabilidad automática de mutaciones en todas las entidades (before/after snapshots). |
| **Admin** | Dashboard de métricas y gestión de usuarios. |

## API Docs

Swagger disponible en `/api/v1/docs` cuando el servidor está corriendo.

## Deployment

El proyecto está configurado para deploy en [Railway](https://railway.app/) (`railway.toml` + `Dockerfile`).

```bash
# build production
pnpm run build

# la imagen Docker expone el puerto 3001
```
