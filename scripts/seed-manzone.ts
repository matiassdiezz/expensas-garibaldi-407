/**
 * Seed script: insert Manzone 1039 data into the Neon DB
 * Run: npx tsx scripts/seed-manzone.ts
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Source .env.local first.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const raw = JSON.parse(
  readFileSync(
    "/Users/matiasdiez/Downloads/Expensas Manzone 1039/data.json",
    "utf-8"
  )
);

const MONTH_LABELS: Record<string, string> = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre",
};

async function main() {
  // 1. Create building
  const id = crypto.randomUUID();
  const slug = raw._meta.slug;
  const name = raw._meta.nombre;
  const address = raw._meta.direccion;
  const adminCompany = raw._meta.administracion;
  const cuit = raw._meta.cuit;

  const existing = await sql`SELECT id FROM buildings WHERE slug = ${slug}`;
  let buildingId: string;

  if (existing.length > 0) {
    buildingId = existing[0].id as string;
    console.log(`Building already exists: ${buildingId}`);
  } else {
    await sql`
      INSERT INTO buildings (id, slug, name, address, admin_company, cuit)
      VALUES (${id}, ${slug}, ${name}, ${address}, ${adminCompany}, ${cuit})
    `;
    buildingId = id;
    console.log(`Created building: ${buildingId}`);
  }

  // 2. Insert liquidaciones
  for (const liq of raw.liquidaciones) {
    const [year, monthNum] = liq.liquidacion.split("-");
    const month = liq.liquidacion;
    const label = `${MONTH_LABELS[monthNum]} ${year}`;

    // Items: filter out zero-amount items, use category/description/amount
    const items = liq.gastos.items
      .filter((i: { amount: number }) => i.amount > 0)
      .map((i: { category: string; description: string; amount: number }) => ({
        category: i.category,
        description: i.description,
        amount: i.amount,
      }));

    const total = liq.gastos.total;
    const expensasA = liq.gastos.gastos_a;

    const cashFlow = {
      saldoAnterior: liq.estado_de_caja.saldo_anterior,
      ingresos: liq.estado_de_caja.ingresos,
      egresos: liq.estado_de_caja.egresos,
      extras:
        liq.estado_de_caja.extras_credito > 0
          ? [
              {
                tipo: "credito",
                monto: liq.estado_de_caja.extras_credito,
                descripcion: "Pase a disposición de fondos reservados",
              },
            ]
          : [],
      saldoFinal: liq.estado_de_caja.saldo_final,
    };

    const prorrateo = {
      expensasA: liq.prorrateo_totals.ordinarias_a,
      expensasB: liq.prorrateo_totals.ordinarias_b,
      totalAPagar: liq.prorrateo_totals.total,
    };

    // Build egresos por seccion from items
    const egresosPorSeccion: Record<string, number> = {};
    for (const item of liq.gastos.items) {
      if (item.amount > 0) {
        egresosPorSeccion[item.category] =
          (egresosPorSeccion[item.category] ?? 0) + item.amount;
      }
    }

    await sql`
      INSERT INTO liquidaciones (building_id, month, label, total, expensas_a, items, periodo, vencimiento, cash_flow, prorrateo, egresos_por_seccion, aviso)
      VALUES (
        ${buildingId},
        ${month},
        ${label},
        ${total},
        ${expensasA},
        ${JSON.stringify(items)}::jsonb,
        ${liq.periodo},
        ${liq.vencimiento},
        ${JSON.stringify(cashFlow)}::jsonb,
        ${JSON.stringify(prorrateo)}::jsonb,
        ${JSON.stringify(egresosPorSeccion)}::jsonb,
        ${liq.aviso}
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

    console.log(`  ✓ ${label} — $${total.toLocaleString("es-AR")}`);
  }

  console.log(
    `\nDone! ${raw.liquidaciones.length} liquidaciones inserted for ${name}`
  );
}

main().catch(console.error);
