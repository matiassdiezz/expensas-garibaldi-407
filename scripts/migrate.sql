-- Expensas Garibaldi 407 — Schema
-- Run against your Neon database to set up the tables

CREATE TABLE IF NOT EXISTS liquidaciones (
  id SERIAL PRIMARY KEY,
  month TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  total NUMERIC NOT NULL,
  expensas_a NUMERIC NOT NULL,
  uf_diez NUMERIC NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  periodo TEXT,
  vencimiento TEXT,
  cash_flow JSONB,
  prorrateo JSONB,
  egresos_por_seccion JSONB,
  aviso TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for month lookups
CREATE INDEX IF NOT EXISTS idx_liquidaciones_month ON liquidaciones(month);
