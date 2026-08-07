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
    "code": "STOCK_NEGATIVE",
    "message": "El stock no puede quedar por debajo de 0.",
    "details": { "field": "quantity" }
  }
}
```

| Código HTTP | Cuándo |
|---|---|
| `200` / `201` | Éxito |
| `400` | Validación Zod fallida / payload malformado |
| `404` | Recurso no encontrado |
| `409` | Conflicto de negocio (stock negativo, duplicados) |
| `422` | Error semántico de dominio |
| `500` | Error interno (sin stack traces expuestos) |

## 4. Endpoints previstos

### Productos

| Método | Ruta | Descripción | Request (conceptual) | Response |
|---|---|---|---|---|
| GET | `/products` | Listar productos (filtros: status, categoryId, q, stockLow) | query params | `[{ id, name, categoryId, supplierId, stock, stockMin, status, imageUrl }]` |
| POST | `/products` | Crear producto | `{ name, categoryId, supplierId?, stockMin, imageUrl? }` | `201 { product }` |
| GET | `/products/:id` | Detalle con historial resumido | — | `{ product }` |
| PATCH | `/products/:id` | Actualizar (incl. cambio de proveedor principal) | `{ name?, categoryId?, supplierId?, stockMin?, status? }` | `{ product }` |
| DELETE | `/products/:id` | Pasar a `INACTIVE` (papelera) — no borra físico | — | `204` |
| POST | `/products/:id/restore` | Restaurar a `ACTIVE` | — | `{ product }` |
| POST | `/products/:id/stock` | Entrada/salida de stock | `{ type, quantity, supplierId?, note? }` | `{ product, movement }` |
| GET | `/products/:id/movements` | Historial de movimientos | query `?page=` | `[{ ...movement }]` |
| POST | `/products/:id/image` | Subir imagen a Supabase Storage y guardar URL | multipart file | `{ imageUrl }` |

### Categorías

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/categories` | Listar |
| POST | `/categories` | Crear `{ name }` |
| PATCH | `/categories/:id` | Renombrar |
| DELETE | `/categories/:id` | Desactivar (no rompe FK históricas) |

### Proveedores

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/suppliers` | Listar (incl. inactivos con filtro) |
| POST | `/suppliers` | Crear `{ name, whatsappNumber, notes? }` |
| PATCH | `/suppliers/:id` | Actualizar |
| DELETE | `/suppliers/:id` | Pasar a `INACTIVE` |
| POST | `/suppliers/:id/restore` | Restaurar |

### Listado de productos del proveedor (`SupplierProduct`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/suppliers/:id/products` | Productos que ofrece el proveedor |
| POST | `/suppliers/:id/products` | Agregar al listado `{ name, categoryId? }` |
| PATCH | `/suppliers/products/:id` | Editar item del listado |
| DELETE | `/suppliers/products/:id` | Quitar del listado (NO toca `Product`) |

### Pedidos / Carrito

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/orders/preview` | Genera mensaje + URL WhatsApp `{ supplierId, items: [{ supplierProductId, quantity }], note? }` |
| POST | `/orders/whatsapp-url` | Devuelve URL `wa.me` con mensaje codificado |

> La lógica de construcción del mensaje es una función pura compartida
> (`buildSupplierOrderMessage`), invocada en el frontend. El endpoint es una
> alternativa para validación/consistencia.

### Dashboard

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/dashboard/summary` | `{ activeProducts, lowStockCount, movementsThisMonth, lowStockProducts[], topPurchased[] }` |

## 5. Notas

- No hay endpoints de auth todavía (Supabase Auth se integrará en la fase
  correspondiente).
- No existe checkout ni pago: el carrito solo prepara el pedido a proveedor.
- La URL de WhatsApp se genera en el cliente:
  `https://wa.me/<phone>?text=<encoded message>`.