-- Migración: productos por UNIDADES o KILOGRAMOS (con decimales) + precio y oferta.
--
-- 1. Enum "Unit": GRAMS -> KG (en DBs ya creadas; en DBs nuevas Prisma crea KG directo).
-- 2. stock / stockMin / quantity / stockBefore / stockAfter: INT -> DOUBLE PRECISION.
-- 3. Nuevas columnas opcionales: price (precio normal) y "promoPrice" (precio oferta).
--    Semántica: en UNITS el precio es por unidad/bolsa; en KG el precio es por kilogramo.
-- 4. CHECKs de integridad como última barrera (la validación fina vive en Zod).

-- ── 1. Enum "Unit" ─────────────────────────────────────────────────────
-- IMPORTANTE / edge cases cubiertos (la migración debe ser noop donde no hay
-- nada que hacer y funcionar en DBs con historias distintas):
--   a) Tipo inexistente (DBs creadas antes de la feature, error 42704):
--      se crea con ambos valores. Obligatorio ANTES del ADD VALUE, porque
--      `IF NOT EXISTS` cubre el *valor*, no el *tipo*: sin 1a el ADD falla.
--   b) RENAME GRAMS->KG dentro de DO (admite transacción).
--   c) ADD VALUE como sentencia plana, FUERA de DO $$ (`ALTER TYPE ... ADD
--      no puede ejecutarse desde una función, error 25001). Tras 1a el tipo
--      siempre existe, así que nunca falla con 42704. En PG 12+ (Supabase)
--      corre dentro de transacción siempre que el valor nuevo no se use en
--      la misma migración (aquí no se usa: defaults y USING usan 'UNITS').
--   d) Columna products.unit inexistente (error 42703): se agrega NOT NULL
--      con DEFAULT 'UNITS' (filas existentes quedan en UNITS/bolsas).
--   e) Columna products.unit TEXT (DBs creadas a mano según docs/database):
--      se normaliza (GRAMS->KG, resto/NULL->UNITS) y se convierte al enum.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Unit') THEN
    CREATE TYPE "Unit" AS ENUM ('UNITS', 'KG');
  ELSIF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Unit' AND e.enumlabel = 'GRAMS'
  ) THEN
    ALTER TYPE "Unit" RENAME VALUE 'GRAMS' TO 'KG';
  END IF;
END
$$;

ALTER TYPE "Unit" ADD VALUE IF NOT EXISTS 'KG';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'unit'
  ) THEN
    ALTER TABLE "products"
      ADD COLUMN "unit" "Unit" NOT NULL DEFAULT 'UNITS'::"Unit";
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'unit' AND data_type = 'text'
  ) THEN
    UPDATE products SET unit = 'KG' WHERE unit = 'GRAMS';
    UPDATE products SET unit = 'UNITS' WHERE unit IS NULL OR unit NOT IN ('UNITS', 'KG');
    ALTER TABLE "products" ALTER COLUMN "unit" TYPE "Unit" USING "unit"::"Unit";
    ALTER TABLE "products" ALTER COLUMN "unit" SET DEFAULT 'UNITS'::"Unit";
    ALTER TABLE "products" ALTER COLUMN "unit" SET NOT NULL;
  END IF;
END
$$;

-- ── 2. Columnas numéricas a DOUBLE PRECISION ────────────────────────────
-- (USING ...::double precision es noop si la columna ya es DOUBLE PRECISION)

ALTER TABLE "products" ALTER COLUMN "stock" TYPE DOUBLE PRECISION USING "stock"::double precision;
ALTER TABLE "products" ALTER COLUMN "stockMin" TYPE DOUBLE PRECISION USING "stockMin"::double precision;
ALTER TABLE "stock_movements" ALTER COLUMN "quantity" TYPE DOUBLE PRECISION USING "quantity"::double precision;
ALTER TABLE "stock_movements" ALTER COLUMN "stockBefore" TYPE DOUBLE PRECISION USING "stockBefore"::double precision;
ALTER TABLE "stock_movements" ALTER COLUMN "stockAfter" TYPE DOUBLE PRECISION USING "stockAfter"::double precision;

-- ── 3. Precio normal y precio oferta (opcionales) ─────────────────────────
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "promoPrice" DOUBLE PRECISION;

-- ── 4. CHECKs ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_stock_nonneg') THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_stock_nonneg" CHECK ("stock" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_stockmin_nonneg') THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_stockmin_nonneg" CHECK ("stockMin" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_price_nonneg') THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_price_nonneg" CHECK ("price" IS NULL OR "price" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_promoprice_nonneg') THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_promoprice_nonneg" CHECK ("promoPrice" IS NULL OR "promoPrice" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_promo_lte_price') THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_promo_lte_price"
      CHECK ("promoPrice" IS NULL OR "price" IS NULL OR "promoPrice" <= "price");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'movements_quantity_positive') THEN
    ALTER TABLE "stock_movements" ADD CONSTRAINT "movements_quantity_positive" CHECK ("quantity" > 0);
  END IF;
END
$$;
