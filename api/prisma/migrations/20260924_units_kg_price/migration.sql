-- Migración: productos por UNIDADES o KILOGRAMOS (con decimales) + precio y oferta.
--
-- 1. Enum "Unit": GRAMS -> KG (en DBs ya creadas; en DBs nuevas Prisma crea KG directo).
-- 2. stock / stockMin / quantity / stockBefore / stockAfter: INT -> DOUBLE PRECISION.
-- 3. Nuevas columnas opcionales: price (precio normal) y "promoPrice" (precio oferta).
--    Semántica: en UNITS el precio es por unidad/bolsa; en KG el precio es por kilogramo.
-- 4. CHECKs de integridad como última barrera (la validación fina vive en Zod).

-- ── 1. Enum ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Unit' AND e.enumlabel = 'GRAMS'
  ) THEN
    ALTER TYPE "Unit" RENAME VALUE 'GRAMS' TO 'KG';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Unit' AND e.enumlabel = 'KG'
  ) THEN
    ALTER TYPE "Unit" ADD VALUE 'KG';
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
