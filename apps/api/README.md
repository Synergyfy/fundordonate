# FundorDonate API

NestJS (TypeScript) backend for FundorDonate.

## Stack

| Concern        | Choice                                      |
| -------------- | ------------------------------------------- |
| Framework      | NestJS 12                                   |
| API docs       | Swagger (`@nestjs/swagger`)                 |
| Database       | PostgreSQL + Prisma ORM                     |
| Cache/Queues   | Redis (`ioredis`) + BullMQ (`@nestjs/bullmq`) |
| Auth           | JWT (access + refresh) via Passport         |
| Validation     | `class-validator` / `class-transformer`     |
| Config         | `@nestjs/config` + zod validation           |

## Getting started

```bash
# 1. Install dependencies (from the monorepo root)
npm install

# 2. Configure environment
cp apps/api/.env.example apps/api/.env   # then edit values

# 3. Provision PostgreSQL + Redis
#    Either use your local services, or:
docker compose -f apps/api/docker-compose.yml up -d

# 4. Generate the Prisma client and apply migrations
npm run db:generate
npm run db:migrate

# 5. (optional) seed an admin user
npm run db:seed

# 6. Run the API
npm run dev:api
```

## Endpoints

| URL                                | Description                          |
| ---------------------------------- | ------------------------------------ |
| `http://localhost:5024/api/v1`     | API root                             |
| `http://localhost:5024/api/docs`   | Swagger UI                           |
| `http://localhost:5024/api/docs-json` | OpenAPI JSON                      |
| `http://localhost:5024/health`     | Health probe (PostgreSQL + Redis)    |

Auth is federated through **MCOM Central Hub SSO**. The only local credential
login is the administrator endpoint.

- `GET  /api/v1/auth/sso/status` — whether SSO is enabled
- `GET  /api/v1/auth/sso/login?state=&returnPath=` — returns the Central authorize URL
- `POST /api/v1/auth/sso/callback` — exchange `{ code, state }` for a local session
- `POST /api/v1/auth/sso/direct-login` — Flow B handshake `{ token }` (requires `SSO_SECRET`)
- `POST /api/v1/auth/sso/refresh-entitlement` (Bearer) — re-introspect entitlement
- `POST /api/v1/auth/sso/logout` — clear local session, returns Central SLO URL
- `POST /api/v1/auth/admin/login` — **admin-only** email + password
- `POST /api/v1/auth/refresh` · `POST /api/v1/auth/logout`
- `GET  /api/v1/auth/me` (Bearer) · `GET /api/v1/auth/entitlement` (Bearer)

The frontend redirect URI is `http://localhost:5023/auth/callback`, which must be
registered for the `fundordonate` client in MCOM Central.

## Project layout

```
src/
├── main.ts          # bootstrap: prefix, CORS, validation, Swagger
├── app.module.ts    # root module wiring
├── config/          # typed configuration + zod env validation
├── common/          # exception filter, response interceptor, shared DTOs
├── prisma/          # PrismaModule + PrismaService
├── redis/           # shared ioredis provider
├── queue/           # BullMQ root registration (add queues in feature modules)
├── health/          # terminus health checks
└── auth/            # JWT auth module
```
