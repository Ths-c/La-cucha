# PLAN DE CAMBIO — FASE 2 (Backend)

> Estado del proyecto en el arranque: Fase 1 completada (arquitectura, docs,
> esqueleto de `web/` y `api/`, schema Prisma, servidor Express con health y
> manejo de errores). Backend en Node + Express + TS + Prisma 6 + Zod 4.

## Decisiones cerradas

| Tema | Decisión |
|---|---|
| Base de datos | Usar credenciales reales de Supabase (`DATABASE_URL`, `DIRECT_URL`) para migrar y hacer seed. |
| Endpoints de stock | Dos endpoints separados: `POST /products/:id/stock/in` y `POST /products/:id/stock/out` (resuelve ambigüedad de `MANUAL_ADJUST`). |
| Imagen de producto | Subida de binarios diferida a Fase 3; `imageUrl` ya existe y el `PATCH /products/:id` permite guardar una URL. |
| Formato de respuesta | Mantener Fase 1: éxito `{ data }`, error `{ error: { code, message, details? } }`. |
| Enums de movimiento | Mantener nombres Fase 1 (`BUY, SALE, BREAKAGE, EXPIRY, DONATION, INTERNAL_CONSUMPTION, MANUAL_ADJUST`), documentar mapeo a conceptos de Fase 2. |
| Campos de producto | Mantener `stock`/`stockMin` (convención Fase 1). |
| Borrado de categoría | Bloquear `DELETE` si tiene `products` o `supplierProducts` (409); permitir borrado físico si está vacía (el schema no tiene `status` en `Category`). |
| WhatsApp builder | Implementar en backend como función pura (`services/whatsapp.service.ts`), expuesta vía `POST /orders/preview` → `{ message, whatsappUrl, supplier }`. |

## Cambios al modelo Prisma

- `SupplierProduct`: + `notes String?`, + `status SupplierProductStatus @default(ACTIVE)`, + `updatedAt DateTime @updatedAt`.
- Nuevo enum `SupplierProductStatus { ACTIVE, INACTIVE }`.
- Migración SQL con `CHECK`s: `products.stock >= 0`, `products."stockMin" >= 0`, `stock_movements.quantity > 0`.
- Nuevo `prisma/seed.ts` con datos ficticios (categorías, proveedores, supplierProducts, productos, movimientos).

## Dependencias

- Runtime: `helmet`.
- Dev: `vitest`.
- (No `@supabase/supabase-js` en api por ahora: imagen diferida.)

## Estructura de archivos (backend)

```
api/src/
  server.ts                   # entrada, monta rutas
  app.ts                       # creación de la app Express (separable para tests)
  config/index.ts              # env: DATABASE_URL, DIRECT_URL, SUPABASE_*, PORT, CORS_ORIGIN, TIMEZONE
  constants/errors.ts          # códigos de error
  types/{domain,express}.ts    # tipos de dominio y Request tipado
  utils/{async-handler,logger,pagination,phone,timezone}.ts
  middleware/{error-handler,request-logger,validate}.ts
  schemas/{product,category,supplier,supplier-product,stock-movement,movement-filter,order}.ts
  repositories/{product,category,supplier,supplier-product,stock-movement}.ts  (+ interfaces)
  services/{product,category,supplier,supplier-product,stock,dashboard,order,whatsapp}.service.ts
  controllers/{product,category,supplier,supplier-product,stock-movement,dashboard,order}.controller.ts
  routes/ (una por recurso)
  lib/prisma.ts                  # instancia única PrismaClient
api/prisma/{schema.prisma, migrations/, seed.ts}
api/tests/*.test.ts
```

## Endpoints a implementar (montados bajo /api)

- **Productos**: `GET /products`, `POST /products`, `GET /products/:id`, `PATCH /products/:id` (sin modificar stock), `DELETE /products/:id` → INACTIVE, `POST /products/:id/restore`, `GET /products/trash`, `POST /products/:id/stock/in`, `POST /products/:id/stock/out`, `GET /products/:id/movements`.
- **Categorías**: `GET /categories`, `POST /categories`, `GET /categories/:id`, `PATCH /categories/:id`, `DELETE /categories/:id` (bloqueado si referenciada).
- **Proveedores**: `GET /suppliers`, `POST /suppliers`, `GET /suppliers/:id`, `PATCH /suppliers/:id`, `DELETE /suppliers/:id` → INACTIVE, `POST /suppliers/:id/restore`, `GET /suppliers/trash`.
- **SupplierProduct**: `GET /suppliers/:id/products`, `POST /suppliers/:id/products`, `PATCH /suppliers/products/:itemId`, `DELETE /suppliers/products/:itemId` → INACTIVE.
- **Movimientos**: `GET /movements` (filtros `type`, `productId`, `from`, `to`; paginado).
- **Dashboard**: `GET /dashboard/summary`.
- **Órdenes**: `POST /orders/preview` (valida items contra proveedor; devuelve mensaje + URL).

## Reglas críticas a garantizar

- Stock negativo imposible: service (409) + `updateMany` con guard `stock >= quantity` (anti race condition) + CHECK en DB.
- Transacción atómica: `$transaction` (leer → chequear → decrementar/incrementar → crear `StockMovement` con `stockBefore`/`stockAfter`), ROLLBACK automático.
- Restauración valida relaciones (categoría existente y `ACTIVE`).
- IDs validados con zodiac coerce (`int().positive()`) en destino/query/body.
- Búsqueda `contains` (insensitive) y paginación en backend (default 20, máx 100).
- Normalización del número de WhatsApp en `utils/phone.ts` (formato `+549XXXXXXXXXX`) y único por proveedor.
- Zona horaria centralizada (`utils/timezone.ts` + `TIMEZONE` de config, default `America/Argentina/Buenos_Aires`); "movimientos del mes" = inicio/fin de mes en esa tz.
- Logging mínimo (JSON, niveles), sin secretos; `helmet` para headers de seguridad.
- Sin `any`; TS estricto; sin queri in Prisma desparramado defendido en repositories.

## Pruebas (vitest, fakes en memoria, sin DB)

1. Sumar stock. 2. Restar stock. 3. Impedir stock negativo. 4. Registrar movimiento. 5. Rollback de transacción. 6. Asociación de proveedor. 7. Restauración de producto. 8. Cálculo de stock bajo. 9. Productos más comprados (agregación BUY). 10. Generación de mensaje WhatsApp. + normalización de teléfono y schemas.

## Orden de ejecución

1. Configurar `api/.env` (usuario) y Supabase MCP.
2. Ajustar `schema.prisma` → generar/aplicar migración → `prisma migrate dev`.
3. Implementar dependencias, utils, middleware, schemas.
4. Implementar repositories (con interfaces), services, controllers, routes.
5. Montar rutas en `app.ts`/`server.ts` y ajustar `lib/prisma.ts`.
6. Crear `seed.ts` y correr `prisma db seed`.
7. Escribir `tests/*.test.ts` y correr `npm test`.
8. `npm run typecheck`, `npm run build`.
9. Levantar API y probar endpoints por HTTP.
10. Actualizar `/docs` (api.md, database.md, decisions.md, reglas de negocio).

## Bloqueantes / pendientes

- Credenciales de Supabase en `api/.env` (proporcionadas por el usuario).
- Subida de imagen de producto → Fase 3.
- Auth (Supabase Auth) → Fase posterior.