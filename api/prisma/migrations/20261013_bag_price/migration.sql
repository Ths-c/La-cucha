-- Migración: precio por kilo + precio por bolsa, y precio usado en la venta.
--
-- 1. Productos: se elimina "promoPrice" (oferta) y se agrega "bagPrice"
--    (precio por bolsa). "price" pasa a ser el precio por kilo.
--    Ambos son independientes y opcionales a nivel columna; la regla
--    "al menos un precio" vive en Zod/servicio.
-- 2. Movimientos: nueva columna opcional "priceType" (KILO/BAG) que indica
--    con cuál de los dos precios se vendió (solo ventas tipo SALE).

-- ── 1. Enum PriceType ──────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PriceType') THEN
    CREATE TYPE "PriceType" AS ENUM ('KILO', 'BAG');
  END IF;
END
$$;

-- ── 2. Productos: bagPrice + drop promoPrice ────────────────────────────
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "bagPrice" DOUBLE PRECISION;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'promoPrice'
  ) THEN
    ALTER TABLE "products" DROP COLUMN "promoPrice";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_promoprice_nonneg') THEN
    ALTER TABLE "products" DROP CONSTRAINT "products_promoprice_nonneg";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_promo_lte_price') THEN
    ALTER TABLE "products" DROP CONSTRAINT "products_promo_lte_price";
  END IF;
END
$$;

-- ── 3. Movimientos: priceType ──────────────────────────────────────────
-- ADD COLUMN con USING textual para tolerar DBs donde la columna ya exista
-- como TEXT (creadas a mano). En DBs limpias es un simple ADD.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_movements' AND column_name = 'priceType'
  ) THEN
    ALTER TABLE "stock_movements" ADD COLUMN "priceType" "PriceType";
  END IF;
END
$$;

-- ── 4. CHECKs ──────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_bagprice_nonneg') THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_bagprice_nonneg"
      CHECK ("bagPrice" IS NULL OR "bagPrice" >= 0);
  END IF;
END
$$;
