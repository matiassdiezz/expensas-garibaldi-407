/**
 * Load Laprida 195 - Marzo 2026 liquidación directly (no API call needed).
 * Data extracted manually from PDF.
 *
 * Usage: DATABASE_URL=... npx tsx scripts/load-laprida.ts
 */

import { neon } from "@neondatabase/serverless";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { console.error("DATABASE_URL is not set"); process.exit(1); }

  const query = neon(dbUrl);
  const slug = "laprida-195";
  const buildingName = "Laprida 195";

  // 1. Get or create building
  let rows = await query`SELECT * FROM buildings WHERE slug = ${slug} LIMIT 1`;
  let buildingId: string;

  if (rows.length > 0) {
    buildingId = rows[0].id as string;
    console.log(`Building exists: ${buildingName} (${buildingId})`);
  } else {
    buildingId = crypto.randomUUID();
    await query`
      INSERT INTO buildings (id, slug, name, address, admin_company, cuit)
      VALUES (
        ${buildingId},
        ${slug},
        ${buildingName},
        ${"Laprida 195, San Isidro, Buenos Aires"},
        ${"Solución Inmobiliaria"},
        ${"33-71922229-9"}
      )
    `;
    console.log(`Building created: ${buildingName} → /edificio/${slug} (${buildingId})`);
  }

  // 2. Liquidación data — parsed from PDF
  const liquidacion = {
    month: "2026-03",
    label: "Marzo 2026",
    total: 2142428.80,
    expensasA: 1642428.80,
    items: [
      { category: "impuestos", description: "Municipalidad de San Isidro - ABL 2A", amount: 446400.00 },
      { category: "servicios-publicos", description: "EDENOR - Factura Marzo", amount: 41640.50 },
      { category: "servicios-publicos", description: "AYSA S.A - Factura Marzo", amount: 217943.40 },
      { category: "abonos-servicios", description: "G Y T Norte SRL - Factura Marzo", amount: 83100.00 },
      { category: "reparaciones", description: "Rodrigo Brem - Reparación entre baños 1C 1B", amount: 200000.00 },
      { category: "gastos-bancarios", description: "Banco Comafi - débito/crédito enero-febrero", amount: 42900.00 },
      { category: "limpieza", description: "SBG Limpieza - Factura Febrero", amount: 311444.90 },
      { category: "administracion", description: "Pablo Ilvento - Honorarios", amount: 230000.00 },
      { category: "administracion", description: "Román Computación S.R.L. - Sistema", amount: 10000.00 },
      { category: "extraordinarias", description: "Consorcio - Reserva extraordinaria", amount: 300000.00 },
      { category: "abonos-servicios", description: "Matafuegos Rufino González - Recarga Anual", amount: 259000.00 },
    ],
    periodo: "Marzo 2026",
    vencimiento: "2026-03-15",
    cashFlow: {
      saldoAnterior: -1381357.00,
      ingresos: 1770732.38,
      egresos: 2142428.80,
      extras: [
        { description: "Reserva Extraordinaria", amount: -8608.00 },
      ],
      saldoFinal: 380767.38,
    },
    prorrateo: {
      expensasA: 1642428.80,
      expensasB: 500000.00,
      totalAPagar: 2142428.80,
    },
    egresosPorSeccion: {
      "impuestos": 446400.00,
      "servicios-publicos": 259583.90,
      "abonos-servicios": 342100.00,
      "reparaciones": 200000.00,
      "gastos-bancarios": 42900.00,
      "limpieza": 311444.90,
      "administracion": 240000.00,
      "extraordinarias": 300000.00,
    },
    aviso: null,
  };

  // Verify total
  const itemsTotal = liquidacion.items.reduce((sum, item) => sum + item.amount, 0);
  console.log(`\nItems total: $${itemsTotal.toLocaleString("es-AR")} (expected: $${liquidacion.total.toLocaleString("es-AR")})`);
  const diff = Math.abs(liquidacion.total - itemsTotal);
  if (diff > 1) {
    console.warn(`⚠ Mismatch: diff = $${diff}`);
  } else {
    console.log(`✓ Totals match`);
  }

  // 3. Print items
  console.log(`\nItems:`);
  for (const item of liquidacion.items) {
    console.log(`  [${item.category}] ${item.description}: $${item.amount.toLocaleString("es-AR")}`);
  }

  // 4. Save to DB
  console.log(`\nSaving to DB...`);
  await query`
    INSERT INTO liquidaciones (building_id, month, label, total, expensas_a, items, periodo, vencimiento, cash_flow, prorrateo, egresos_por_seccion, aviso)
    VALUES (
      ${buildingId},
      ${liquidacion.month},
      ${liquidacion.label},
      ${liquidacion.total},
      ${liquidacion.expensasA},
      ${JSON.stringify(liquidacion.items)}::jsonb,
      ${liquidacion.periodo},
      ${liquidacion.vencimiento},
      ${JSON.stringify(liquidacion.cashFlow)}::jsonb,
      ${JSON.stringify(liquidacion.prorrateo)}::jsonb,
      ${JSON.stringify(liquidacion.egresosPorSeccion)}::jsonb,
      ${liquidacion.aviso}
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

  console.log(`\n✅ Done! ${liquidacion.label} saved for ${buildingName}`);
  console.log(`   View at: https://expensas-garibaldi-407.vercel.app/edificio/${slug}`);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
