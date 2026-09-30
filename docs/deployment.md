# Guía de despliegue (producción)

Diagrama de referencia: `architecture.md`. Para replicar localmente las
instancias de nube, ver la sección "Servicios en nube" del `README` y
`local.env`.

## 1. Variables de entorno de la API (obligatorias)

| Variable | Descripción | Origen |
|---|---|---|
| `DATABASE_URL` | Cadena Prisma a Postgres | Supabase |
| `AUTH_SECRET` | Firma del token de auth | genera tú mismo |
| `ADMIN_EMAIL`/`ADMIN_PASSWORD` | Credenciales del dueño | elige tú |
| `ADMIN_ID` | Relacionar movimientos del dueño (movimientos externos) | random UUID |
| `DIRECT_URL` | Cadena de prisma para migraciones *solo local* (pooler de Supabase no ejecuta `transactional` DDL) | — |

> **IMPORTANTE:** en producción NUNCA setees `NODE_ENV` como `development`.
> El servidor exige auth y la API se marca `no-cache`.

## 2. Desplegar la API en Render

1. Nuevo **Web Service** apuntando al repo (root de la API = `api/`).
2. Build: `npm ci && npm run build` — Start: `node dist/server.js`.
3. Agregar todas las variables de la tabla (sin `_URL`).
4. Tras crear la base, correr migraciones una sola vez (ver sección 3).
5. Tras el deploy, verificar:

```bash
curl -s https://<tu-api>.onrender.com/api/health
# → {"status":"ok","deployedAt":"..."}
```

### Migrar el esquema (esquema ya versionado en `api/prisma/migrations`)

El pool de Supabase no ejecuta el movimiento `_prisma_migrations`; conéctate
por un puerto **directo** de Supabase y empuja las migraciones:

```bash
# desde /api
DATABASE_URL="<prisma url directa>" npx prisma migrate deploy
```

> Si `GET /api/dashboard/summary` devuelve `500` tras el deploy de la versión
> de unidades/KG, es drift de esquema: la migración `20260924_units_kg_price`
> (enum `Unit`, `stock` a `DOUBLE PRECISION`, `+ unit/price/promoPrice`) no se
> aplicó en la DB de prod. Verifica con:
> `SELECT column_name FROM information_schema.columns WHERE table_name='products'`
> (debe existir `price`) y re-corre el `migrate deploy` con la URL directa.
> Los logs de Render ahora indican el paso exacto (`dashboard_summary_step_failed`,
> `error_prisma` con `code` P2022 = columna faltante).
>
> ### Baseline: DB que nunca usó Prisma Migrate
>
> Si `SELECT to_regclass('_prisma_migrations')` devuelve `null`, la DB se creó
> antes de usar `migrate` (ej. vía `db push` o a mano). Pasos:
>
> 1. Pegar el contenido íntegro de
>    `api/prisma/migrations/20260924_units_kg_price/migration.sql` en el SQL
>    editor de Supabase y ejecutarlo (es idempotente; crea el tipo `Unit`,
>    agrega `unit/price/promoPrice`, convierte a `DOUBLE PRECISION` y crea CHECKs).
> 2. Registrar el historial a mano (equivale a `migrate resolve --applied`;
>    DDL exacto del engine Prisma 6):
>
> ```sql
> CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
>     "id" VARCHAR(36) PRIMARY KEY NOT NULL,
>     "checksum" VARCHAR(64) NOT NULL,
>     "finished_at" TIMESTAMPTZ,
>     "migration_name" VARCHAR(255) NOT NULL,
>     "logs" TEXT,
>     "rolled_back_at" TIMESTAMPTZ,
>     "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
>     "applied_steps_count" INTEGER NOT NULL DEFAULT 0
> );
> INSERT INTO "_prisma_migrations"
>   ("id","checksum","finished_at","migration_name","logs","rolled_back_at","started_at","applied_steps_count")
> VALUES
>   (gen_random_uuid()::text,'<sha256 de migration.sql>',now(),'20260924_units_kg_price','',NULL,now(),0);
> ```
>
> ⚠️ El `checksum` es el sha256 del archivo (`sha256sum
> prisma/migrations/20260924_units_kg_price/migration.sql`) y debe coincidir
> exacto. **No editar jamás un migration.sql ya aplicado**: cualquier cambio
> futuro va en una nueva carpeta de migración.

### DB remota

`DATABASE_URL` apunta al pool de Supabase (ideal para la API). Las migraciones
se ejecutan contra la URL directa del mismo proyecto.

## 3. Desplegar el panel en Vercel

1. Importar el repo; dirroot build = `web/`.
2. Build: `npm ci && npm run build`; output dir `web/dist`.
3. Variables de entorno del panel:

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API (ej. `https://<tu-api>.onrender.com`) |

Ningún secreto debe ir al frontend (no hay claves de servicio acá).

## 4. Env local (referencia, **no** se sube)

- API: `api/.env` — lo carga `dotenv/config`; está en `.gitignore`. Guarda
  correspondencias de `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`,
  `ADMIN_PASSWORD`, `ADMIN_ID`.
- Panel: `.env.local` — está en `.gitignore`. Guarda `VITE_API_URL`
  (ej. `http://localhost:4000/api` en dev).

## 5. Post-deploy checklist

- [ ] `health` responde `ok`.
- [ ] `POST /api/auth/login` devuelve `401` con credencial inválida.
- [ ] Una ruta de datos con un token recién emitido responde datos.
- [ ] Sin `Authorization` → `401 UNAUTHENTICATED`.
- [ ] En `api/` se ve el banner de auditoría (pantalla "no-corrected").

## 6. Seguridad

- `helmet()` y `cors({ origin: config.server.corsOrigin })` están activos.
  `CORS_ORIGIN` debe apuntar al dominio del panel en producción.
- `helmet` solo aplica headers de seguridad a las respuestas de la API; el
  frontend cifrado/bruto por Vercel es propio.
- Los errores nunca exponen stack traces ni detalles internos.
- `AUTH_SECRET`/`ADMIN_PASSWORD` son secretos: rotarlos no es relevante para
  un solo dueño pero no deben va en el repo. `.env.local`/`.env.production.local`
  están en `.gitignore` (confirmar).