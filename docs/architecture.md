# Arquitectura — Sistema de Gestión de Stock para Pet Shop

## 1. Visión general

Aplicación web **online** para un único dueño de pet shop que permite gestionar
productos, categorías, proveedores, stock, movimientos y pedidos a proveedores
vía un enlace de WhatsApp.

## 2. Principio arquitectónico

**Monolito modular.** Dos aplicaciones independientes en un mismo repositorio,
separadas en capas (presentación → negocio → datos → infraestructura), sin
microservicios, sin CQRS, sin Docker obligatorio, sin Kubernetes.

```
LaCucha/
├─ web/                 # Frontend (Vite + React + TS)
├─ api/                 # Backend (Node + Express + TS)
│   └─ prisma/          # schema.prisma + migrations + seed
└─ docs/                # Documentación técnica
```

## 3. Diagrama de flujo de datos

```mermaid
flowchart TD
    subgraph Client["🎨 Frontend (web/)"]
        UI[Pages / Components]
        Q[TanStack Query]
        SVC[Services / API client]
    end

    subgraph Server["Backend (api/)"]
        R[Routes]
        C[Controllers]
        SRVC[Services]
        REPO[Repositories]
        MSG[WhatsApp message builder (separado)]
    end

    subgraph Data["Infraestructura"]
        DB[(Supabase PostgreSQL)]
        STOR[(Supabase Storage)]
    end

    UI --> Q --> SVC
    SVC -->|HTTP / REST| R
    R --> HC
    HC --> SRVC
    SRVC --> REPO
    REPO --> DB
    HC --> MS
    MS --> WASM[URL wa.me]
    SRVC -.-> STOR
```

## 4. Responsabilidades de cada capa (Backend)

| Capa | Responsabilidad |
|---|---|
| **Routes** | Definición de rutas HTTP y conexión con controllers. |
| **Controllers** | Fina y sin lógica de negocio. Valida entrada con Zod, llama al Service, mapea la respuesta HTTP y traduce errores de dominio. |
| **Services** | Lógica de negocio. Reglas (stock no negativo, transacciones de stock, construcción de mensaje de pedido, cálculo de alertas). |
| **Repositories** | Único lugar que accede a datos (Prisma). Expone primitivas sin reglas. |
| **Middleware** | Manejo unificado de errores, CORS, parseo JSON, (futuro: auth). |
| **Schemas (Zod)** | Validación de entradas en el borde de la API. |
| **Config** | Lectura de variables de entorno y clientes (Prisma, Supabase). |

**Flujo de una petición:**

```text
HTTP → Route → Controller (Zod) → Service → Repository → Prisma → PostgreSQL
                                             └──── transpila en una transacción con StockMovement
```

## 5. Responsabilidades (Frontend)

| Capa | Responsabilidad |
|---|---|
| **Pages** | Componentes de nivel de página, composición de features. |
| **Features** | Módulos de funcionalidad (products, suppliers, orders, stock, dashboard). |
| **Components** | Componentes reutilizables (UI). |
| **Services** | Cliente API y hooks de TanStack Query. |
| **Hooks** | Hooks de lógica de interacción. |
| **Schemas** | Schemas Zod compartidos con la API. |
| **Lib** | Clientes (Supabase Storage), queryClient. |
| **Layouts** | Layouts de rutas (shell con navbar). |
| **Types / Utils** | Tipos compartidos y funciones puras. |

## 5. Puntos importantes de diseño

- **Stock**: solo se modifica mediante `StockService.stockIn()` / `stockOut()`,
  ejecutados en una transacción que aplica el cambio y registra un
  `StockMovement`. Ningún otro lugar modifica el campo `stock`.
- **No borrados físicos**: productos y proveedores pasan a `INACTIVE`
  (papelera) para preservar integridad histórica.
- **WhatsApp**: la construcción del mensaje y de la URL son funciones puras
  aisladas de React, en `features/orders/`.
- **Imágenes**: Supabase Storage, en `Product.imageUrl` solo se guarda la URL.

## 6. Escalabilidad

Se dejan puntos de extensión razonables, pero no se construye nada por adelantado:

- Multi-proveedor por producto → futura tabla junction `ProductSupplier`.
- Multi-tenant / multi-usuario → diferido; no hay tablas multi-tenant ahora.
- Auth → Supabase Auth (documentado en `decisions.md`), no implementado.