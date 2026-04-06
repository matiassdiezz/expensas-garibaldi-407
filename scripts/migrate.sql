-- Expensas Multi-Building Migration
-- Run against your Neon database to add multi-building support

-- 1. Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  admin_company TEXT,
  cuit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed Garibaldi 407 as first building
INSERT INTO buildings (id, slug, name, address, admin_company, cuit)
VALUES (
  'b1e5d4a0-7f3c-4e2a-9d1b-6a8c3f0e2d5b',
  'garibaldi-407',
  'Consorcio Garibaldi 407/411',
  'Garibaldi 407/411, San Isidro',
  'Andrade Inmobiliaria',
  '30-71434946-1'
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Add building_id column to liquidaciones (nullable first for migration)
ALTER TABLE liquidaciones ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES buildings(id);

-- 4. Backfill existing liquidaciones with Garibaldi building
UPDATE liquidaciones
SET building_id = 'b1e5d4a0-7f3c-4e2a-9d1b-6a8c3f0e2d5b'
WHERE building_id IS NULL;

-- 5. Make building_id NOT NULL now that all rows are backfilled
ALTER TABLE liquidaciones ALTER COLUMN building_id SET NOT NULL;

-- 6. Drop old unique constraint on month (may be named differently)
ALTER TABLE liquidaciones DROP CONSTRAINT IF EXISTS liquidaciones_month_key;

-- 7. Add new unique constraint on (building_id, month)
ALTER TABLE liquidaciones ADD CONSTRAINT liquidaciones_building_month_unique UNIQUE (building_id, month);

-- 8. Drop old month-only index and create new composite index
DROP INDEX IF EXISTS idx_liquidaciones_month;
CREATE INDEX IF NOT EXISTS idx_liquidaciones_building_month ON liquidaciones(building_id, month);

-- 9. Drop uf_diez column (Garibaldi-specific, no longer needed)
ALTER TABLE liquidaciones DROP COLUMN IF EXISTS uf_diez;
