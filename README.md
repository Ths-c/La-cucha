# La Cucha · Gestión de Stock

Sistema web de gestión de stock para una pet shop. Un solo dueño, usado
exclusivamente online.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + Vite + React Router + Tailwind CSS + TanStack Query + React Hook Form + Zod |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de datos | PostgreSQL (Supabase) |
| Storage | Supabase Storage |
| Deploy | Vercel (frontend) · Render free (API) · Supabase |

> Estado: **Fase 1** — arquitectura, documentación y esqueleto del proyecto.
> Las funcionalidades de negocio se implementarán en la Fase 2.

## Estructura

```
web/                    # Frontend (Vite + React + TS)
api/                    # Backend (Express + TS)
  └─ prisma/            # schema.prisma + migraciones + seed
docs/                   # Documentación técnica
  ├─ architecture.md
  ├─ database.md
  ├─ api.md
  └─ decisions.md
```

## Requisitos

- Node.js ≥ 20 (probado con Node 22).

## Configuración inicial

### 1. Variables de entorno

- `api/`: copia `api/.env.example` → `api/.env` y completa `DATABASE_URL`
  (Supabase Postgres) y las claves de Supabase.
- `web/`: copia `web/.env.example` → `web/.env.local` con la ANON key de
  Supabase (solo valores públicos).

### 2. Backend (API)

```bash
cd api
npm install
npm run dev            # http://localhost:4000
```

### 3. Frontend

```bash
cd web
npm install
npm run dev            # http://localhost:5173
```

### 4. Base de datos (cuando se configure Supabase)

En la Fase 2 se ejecutará:

```bash
cd api
npx prisma migrate dev
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Dev server (API: `tsx watch` · web: `vite`) |
| `npm run build` | Compilar producción |
| `npm run typecheck` | Verificación de tipos (TS) |

## Documentación

Consulta `docs/` para la arquitectura, modelo de datos, contrato de API y
decisiones tomadas.