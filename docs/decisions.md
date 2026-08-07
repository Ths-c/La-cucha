# Decisiones de Arquitectura — Sistema de Gestión de Stock para Pet Shop

## Introducción

Este documento registra las decisiones arquitectónicas relevantes, las
alternativas consideradas y el motivo de cada elección. Las decisiones se
toman priorizando: simplicidad, mantenibilidad, seguridad, separación de
responsabilidades, buena DX y facilidad de evolución. Se evita la
sobrearquitectura.

## D1. Stack tecnológico

**Decisión:** Frontend React + TS + Vite + Tailwind + TanStack Query + RHF + Zod;
Backend Node + Express + TS; Prisma; Supabase (Postgres + Storage).

**Alternativas:** Next.js full-stack; no usar ORM; base de datos SQLite.

**Motivo:** El stack pedido es el estándar para un monolito con separación clara
API/SPA (Vercel + Render). Express es ligero para un monolito. Prisma + Supabase
elimina la administración de la DB. Se evitó Next.js porque se quiere una API
separada desplegable en su propio host y una SPA en Vercel.

## D2. SPA + API separada (dos aplicaciones)

**Decisión:** Repositorio único con `web/` y `api/` independientes.

**Alternativas:** monorepo con workspaces de npm; Next.js full-stack.

**Motivo:** mayor sencillez de despliegue y de mentalidad; cada app con su propia
`package.json`, sin tooling extra de workspaces. La desventaja (frameworks
duplicados a nivel tipado) se acepta en este tamaño.

## D3. Backend en Render (free tier)

**Decisión:** Render free web service para Express.

**Alternativas:** Railway (trial + uso facturable); Vercel Functions; Supabase
Edge Functions; Fly.io.

**Motivo:** Render tiene un free tier duradero con deploy continuo desde Git y no
presiona facturación. La contra (spin-down con cold start ~1 min al volver
inactivo) es aceptable para un panel de un solo dueño. Supabase no puede ejecutar
Node/Express (solo edge functions), por lo que no es candidato.

## D4. Autenticación futura → Supabase Auth

**Decisión:** Para la fase de auth se usará **Supabase Auth** (email + contraseña).

**Alternativas:** JWT custom con bcrypt en Express; implementación propia de
sessions.

**Motivo:** Supabase ya aporta Postgres y Storage; añadir Supabase Auth evita
almacenar contraseñas hasheadas en nuestro código/DB y reduce la superficie de
seguridad. Se documenta ahora y se implementa en la fase correspondiente. No se
implementa en esta fase (un solo dueño, sin requisito funcional de login aún).

## D5. Estructura de carpetas por capas

**Decisión:** Estructura `web/` y `api/` con separación pages/components/features
(web) y controllers/services/repositories (api).

**Alternativas:** Clean Architecture con `use-cases/` y `application/`; vertical
slices estrictos.

**Motivo:** La estructura propuesta es la más equilibrada para un monolito modular
sin sobrearquitectura. Clean Architecture aportaría capas extra que no se
necesitan. Los `features/` del frontend agrupan funcionalidad de forma natural.

## D6. Stock centralizado y transaccionado

**Decisión:** `StockService` es el único lugar que modifica el stock; transacción
que aplica el ajuste e inserta `StockMovement`. `stockOut` que dejaría stock < 0
se rechaza.

**Alternativas:** dejar que cualquier endpoint actualice `product.stock`.

**Motivo:** centralizar garantiza que cada cambio de stock es auditable y
consistente, y que el invariante de negocio se controla en un único punto.

## D7. Restricción `stock >= 0` en la base de datos

**Decisión:** constraint `CHECK (stock >= 0)` a nivel PostgreSQL, además de la
validación lógica.

**Alternativa:** confiar solo en services/Zod.

**Motivo:** la DB es la última barrera infranqueable; aunque un error de código
intente dejar el stock negativo, la DB lo impide (defensa en profundidad).

## D8. `SupplierProduct` independiente de `Product`

**Decisión:** tabla `SupplierProduct` sin FK a `Product`.

**Motivo:** los listados de los proveedores y los productos de tienda son
entidades conceptualmente autónomas. Evitar FK evita borrados/cálculos en cascada
por parte del negocio. Esta separación también permite listados que aún no
existen como producto de tienda.

## D9. Sin borrados físicos (papelera)

**Decisión:** `Product`, `Supplier`, `Category` pasan a `INACTIVE`; se restauran
vía `restore`. El historial (`StockMovement`) no se elimina.

**Alternativa:** `DELETE` físico.

**Motivo:** preserva la integridad histórica y cumple el requisito de papelera
sin pérdida de datos.

## D10. Imágenes en Supabase Storage

**Decisión:** imagen subida a Supabase Storage (`product-images`) y solo la URL
se guarda en `Product.imageUrl`.

**Alternativas:** blob en Postgres; almacenamiento propio; CDN extra.

**Motivo:** sin blobs en la DB (tamaño y rendimiento), sin servidor propio
(requisito), y Supabase Storage ya está en el stack.

## D11. WhatsApp sin API

**Decisión:** funciones puras `buildSupplierOrderMessage` y `buildWhatsAppUrl`
que generan `https://wa.me/<phone>?text=<encoded>`, separadas de React.

**Alternativa:** integración con WhatsApp Business API.

**Decisión:** la API de WhatsApp es un servicio de pago y con configuración
complicada. El requisito es solo generar la URL y dejar que el dueño envíe
manualmente. Las funciones puras son fácilmente testeables y aisladas.

## D12. Multi-proveedor futuro (punto de extensión)

**Decisión:** hoy `Product.supplierId` nullable y único. Punto de extensión:
tabla junction `ProductSupplier` en el futuro. No se crea ahora.

**Alternativa:** crear `ProductSupplier` ya.

**Motivo:** evita tablas y complejidad "por si acaso". El requisito actual es un
solo proveedor principal; el cambio se hará con migrations de Prisma cuando
corresponda.

## D13. Sin multi-tenant ni multiusuario ahora

**Decisión:** no hay tablas de negocio/tenant/usuario. Autenticación diferida.

**Motivo:** prioriza la regla de no sobrearquitectura (único dueño). Los puntos
de extensión razonables (multi-proveedor, Supabase Auth) quedan documentados.

## D14. Manejo de errores uniforme

**Decisión:** `{ error: { code, message, details? } }` con `AppError` en el backend
y un `handleError` middleware.

**Alternativa:** excepciones ad hoc desde cada controller.

**Motivo:** consistencia total sin exponer stack traces. El frontend mapea
`message` a texto amigable.