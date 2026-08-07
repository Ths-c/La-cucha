# API — Sistema de Gestión de Stock para Pet Shop

## 1. Estilo

REST, JSON. Base URL (dev): `http://localhost:4000/api`.

Separación estricta por capa:

```text
Controller → Service → Repository → Database
```

- **Controllers**: finos, validan con Zod y delegan en Services.
- **Services**: reglas de negocio (stock, transacciones).
- **Repositories**: acceso a datos con Prisma.

## 2. Formato de respuesta

```json
{
  "data": { }
}
```

## 3. Formato de error (uniforme)

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "No hay stock suficiente para realizar este movimiento.",
    "details": { "field": "quantity" }
  }
}
```

| Código HTTP | Cuándo |
|---|---|
| `200` / `201` | Éxito |
| `400` | Validación (`VALIDATION_ERROR`, `INVALID_RELATION`) |
| `401` | No autenticado (`UNAUTHENTICATED`, `INVALID_CREDENTIALS`) |
| `404` | Recurso no encontrado |
| `409` | Conflicto de negocio (`CONFLICT`, `INSUFFICIENT_STOCK`, `DUPLICATE_ENTRY`, `CATEGORY_IN_USE`) |
| `500` | Error interno (sin stack traces expuestos) |
| `503` | Servidor no configurado (`AUTH_SECRET` ausente → `INTERNAL_ERROR`) |

Los códigos de error se centralizan en `constants/errors.ts`.

## 4. Autenticación

Todas las rutas salvo `/api/health`, `/api/auth/login` y `/api/auth/me` requieren
un header `Authorization: Bearer <token>`. El token es un JWT-like HMAC-SHA256
firmado con `AUTH_SECRET`, válido `AUTH_TOKEN_TTL_SECONDS` (12 h por defecto).

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` (credenciales de `ADMIN_EMAIL`/`ADMIN_PASSWORD`) → `{ data: { token, expiresAt, email } }` |
| GET | `/api/auth/me` | Valida el token y devuelve `{ data: { email } }` |

Si `AUTH_SECRET` no está seteado el servidor responde `503` en las rutas
protegidas, dejando claro que la auth no está preparada (nunca la saltea).

> Es un esquema de un solo dueño (sin multiusuario). Se documenta como solución
> intermedia; migrar a Supabase Auth queda como punto de extensión en
> `decisions.md`.

## 5. Endpoints previstos

### Productos

| Método | Ruta | Descripción | Request (conceptual) | Response |
|---|---|---|---|---|
| GET | `/products` | Listar productos (filtros: `status`, `categoryId`, `supplierId`, `search`, `lowStock`; paginado) | query params | `{ data: { items[], total, page, limit, totalPages } }` |
| POST | `/products` | Crear producto (stock inicial => movimiento `BUY` `"Stock inicial"`) | `{ name, categoryId, supplierId?, stock?, stockMin?, imageUrl? }` | `201 { product }` |
| GET | `/products/trash` | Listar productos `INACTIVE` | — | `{ items[] }` |
| GET | `/products/:id` | Detalle con relaciones (categoría, proveedor) | — | `{ product }` |
| PATCH | `/products/:id` | Actualizar datos (NUNCA toca stock) | `{ name?, categoryId?, supplierId?, stockMin?, status?, imageUrl? }` | `{ product }` |
| DELETE | `/products/:id` | Pasar a `INACTIVE` (papelera) — no borra físico | — | `{ product }` |
| POST | `/products/:id/restore` | Restaurar a `ACTIVE` (valida relaciones) | — | `{ product }` |
| POST | `/products/:id/stock/in` | Entrada de stock (`BUY` o `MANUAL_ADJUST`) | `{ type, quantity, supplierId?, note? }` | `{ data: { product, movement } }` |
| POST | `/products/:id/stock/out` | Salida de stock (`SALE`, `BREAKAGE`, `EXPIRY`, `DONATION`, `INTERNAL_CONSUMPTION`, `MANUAL_ADJUST`) | `{ type, quantity, supplierId?, note? }` | `{ data: { product, movement } }` |
| GET | `/products/:id/movements` | Historial del producto (filtro `type`, paginado) | query `?page=&type=` | `{ data: paginated }` |

### Categorías

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/categories` | Listar (orden alfabético) |
| POST | `/categories` | Crear `{ name }` (409 si ya existe) |
| GET | `/categories/:id` | Detalle |
| PATCH | `/categories/:id` | Renombrar |
| DELETE | `/categories/:id` | Borrado físico SOLO si está vacía; `409 CATEGORY_IN_USE` si tiene productos |

### Proveedores

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/suppliers` | Listar (filtro `search`, `status`; paginado) |
| POST | `/suppliers` | Crear `{ name, whatsappNumber, notes? }` (WhatsApp normalizado y único) |
| GET | `/suppliers/trash` | Listar `INACTIVE` |
| GET | `/suppliers/:id` | Detalle |
| PATCH | `/suppliers/:id` | Actualizar |
| DELETE | `/suppliers/:id` | Pasar a `INACTIVE` (papelera) |
| POST | `/suppliers/:id/restore` | Restaurar |

> El `DELETE`/papelera solo desactiva; nunca borra los `Product` ni el historial
> de movimientos que referencian al proveedor.

### Listado de productos del proveedor (`SupplierProduct`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/suppliers/:id/products` | Productos que ofrece el proveedor (filtro `search`, `categoryId`, `status`; paginado) |
| POST | `/suppliers/:id/products` | Agregar al listado `{ name, categoryId?, notes? }` |
| PATCH | `/suppliers/:id/products/:itemId` | Editar item del listado |
| DELETE | `/suppliers/:id/products/:itemId` | Pasar item a `INACTIVE` (NO toca `Product`) |

> `SupplierProduct` es el catálogo de lo que ofrece cada proveedor, independiente
> de los `Product` de la tienda (no hay FK a `Product`).

### Movimientos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/movements` | Historial global (filtros `type`, `productId`, `from`, `to`; paginado) |

### Pedidos / Carrito

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/orders/preview` | Valida items contra proveedor y devuelve `{ message, whatsappUrl, supplier, items, note }` — `{ supplierId, items: [{ supplierProductId, quantity }], note? }` |

> La construcción del mensaje es una función pura (`buildSupplierOrderMessage`),
> compartida con el frontend. El endpoint `preview` valida que cada item
> pertenezca al proveedor y que el proveedor esté `ACTIVE`, y devuelve la URL
> `wa.me` lista para abrir. No persiste nada (carrito = estado del frontend).

### Dashboard

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/dashboard/summary` | `{ activeProducts, lowStockCount, movementsThisMonth, lowStockProducts[], topPurchased[] }` |

## 6. Notas

- Auth de un solo dueño protegido por Bearer token (ver sección 4). Todos los
  endpoints administrativos exigen autenticación.
- No existe checkout ni pago: el carrito solo prepara el pedido a proveedor.
- La URL de WhatsApp (`https://wa.me/<phone>?text=<encoded>`) la genera el
  backend en `POST /orders/preview` con el mensaje ya armado.
- Errores de negocio usan `409`; la validación de entrada usa `400`. Códigos en
  `constants/errors.ts`.