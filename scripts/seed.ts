/**
 * Seed script — migrates existing static data (data.ts + liquidaciones.json) into Neon DB.
 * Requires the multi-building migration (migrate.sql) to have been run first.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... npx tsx scripts/seed.ts
 */

import { neon } from "@neondatabase/serverless";
import { expensasData } from "../src/lib/data";
import liquidacionesRaw from "../src/lib/liquidaciones.json";

const GARIBALDI_BUILDING_ID = "b1e5d4a0-7f3c-4e2a-9d1b-6a8c3f0e2d5b";

const liquidaciones = (
  liquidacionesRaw as { liquidaciones: Array<Record<string, unknown>> }
).liquidaciones;

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(url);

  console.log(`Seeding ${expensasData.length} liquidaciones for Garibaldi 407...`);

  for (const md of expensasData) {
    const liq = liquidaciones.find(
      (l) => l.liquidacion === md.month
    ) as Record<string, unknown> | undefined;

    const cashFlow = liq?.cashFlow ?? null;
    const prorrateo = liq?.prorrateo ?? null;
    const egresos = liq?.egresos as
      | { secciones: Record<string, number> }
      | undefined;
    const egresosPorSeccion = egresos?.secciones ?? null;
    const aviso = (liq?.aviso as string) ?? null;
    const periodo = (liq?.periodo as string) ?? null;
    const vencimiento = (liq?.vencimiento as string) ?? null;

    await sql`
      INSERT INTO liquidaciones (building_id, month, label, total, expensas_a, items, periodo, vencimiento, cash_flow, prorrateo, egresos_por_seccion, aviso)
      VALUES (
        ${GARIBALDI_BUILDING_ID},
        ${md.month},
        ${md.label},
        ${md.total},
        ${md.expensasA},
        ${JSON.stringify(md.items)}::jsonb,
        ${periodo},
        ${vencimiento},
        ${cashFlow ? JSON.stringify(cashFlow) : null}::jsonb,
        ${prorrateo ? JSON.stringify(prorrateo) : null}::jsonb,
        ${egresosPorSeccion ? JSON.stringify(egresosPorSeccion) : null}::jsonb,
        ${aviso}
      )
      ON CONFLICT (building_id, month) DO UPDATE SET
        label = EXCLUDED.label,
        total = EXCLUDED.total,
        expensas_a = EXCLUDED.expensas_a,
        items = EXCLUDED.items,
        periodo = EXCLUDED.periodo,
        vencimiento = EXCLUDED.vencimiento,
        cash_flow = EXCLUDED.cash_flow,
        prorrateo = EXCLUDED.prorrateo,
        egresos_por_seccion = EXCLUDED.egresos_por_seccion,
        aviso = EXCLUDED.aviso
    `;

    console.log(`  ✓ ${md.label} (${md.month})`);
  }

  console.log(`\nDone! ${expensasData.length} liquidaciones seeded.`);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
