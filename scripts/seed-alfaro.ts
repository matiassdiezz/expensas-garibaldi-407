/**
 * Seed script: insert Alfaro 180 data into the Neon DB
 * Run: npx tsx scripts/seed-alfaro.ts
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
  readFileSync("/Users/matiasdiez/Downloads/Expensas 331/data.json", "utf-8")
);

// Category mapping: Alfaro rubro names → standard categories
function mapRubro(rubro: string): string {
  const map: Record<string, string> = {
    "Abonos de servicios": "abonos-servicios",
    "Servicios públicos": "servicios-publicos",
    "Gastos de limpieza": "limpieza",
    "Seguros": "seguros-gastos",
    "Gastos de administración": "administracion",
    "Gastos particulares": "otros",
    "Trabajos en el edificio": "reparaciones",
    "Gastos varios": "otros",
  };
  return map[rubro] ?? "otros";
}

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
  const slug = "alfaro-180";
  const name = "Alfaro 180";
  const address = "Alfaro 180, San Isidro";
  const adminCompany = "Administración Salgado";

  // Check if already exists
  const existing = await sql`SELECT id FROM buildings WHERE slug = ${slug}`;
  let buildingId: string;

  if (existing.length > 0) {
    buildingId = existing[0].id as string;
    console.log(`Building already exists: ${buildingId}`);
  } else {
    await sql`
      INSERT INTO buildings (id, slug, name, address, admin_company, cuit)
      VALUES (${id}, ${slug}, ${name}, ${address}, ${adminCompany}, ${"27165159379"})
    `;
    buildingId = id;
    console.log(`Created building: ${buildingId}`);
  }

  // 2. Insert liquidaciones
  for (const liq of raw.liquidaciones) {
    const [year, monthNum] = liq.liquidacion.split("-");
    const month = liq.liquidacion; // "2025-10"
    const label = `${MONTH_LABELS[monthNum]} ${year}`;

    // Flatten rubros into ExpenseItem[]
    const items: Array<{ category: string; description: string; amount: number }> = [];
    for (const rubro of liq.gastos.rubros) {
      const category = mapRubro(rubro.rubro);
      for (const item of rubro.items) {
        items.push({
          category,
          description: `${item.proveedor}${item.descripcion ? " – " + item.descripcion : ""}`,
          amount: item.monto,
        });
      }
    }

    const total = liq.gastos.total;
    const expensasA = liq.gastos.expensa_a;

    const cashFlow = {
      saldoAnterior: liq.estado_de_caja.saldo_anterior,
      ingresos:
        liq.estado_de_caja.ingresos_en_termino +
        liq.estado_de_caja.ingresos_adeudadas +
        liq.estado_de_caja.ingresos_intereses,
      egresos:
        liq.estado_de_caja.egresos_a +
        liq.estado_de_caja.egresos_b +
        liq.estado_de_caja.egresos_d +
        liq.estado_de_caja.egresos_fondo_reserva,
      extras: [] as Array<{ tipo?: string; monto: number; descripcion: string }>,
      saldoFinal: liq.estado_de_caja.saldo_al_cierre,
    };

    const prorrateo = {
      expensasA: liq.gastos.expensa_a,
      expensasB: 0,
      totalAPagar: liq.prorrateo_totals.total,
    };

    // Build egresos por seccion from rubros
    const egresosPorSeccion: Record<string, number> = {};
    for (const rubro of liq.gastos.rubros) {
      const cat = mapRubro(rubro.rubro);
      egresosPorSeccion[cat] = (egresosPorSeccion[cat] ?? 0) + rubro.total;
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
        ${null}
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

  console.log(`\nDone! ${raw.liquidaciones.length} liquidaciones inserted for ${name}`);
}

main().catch(console.error);
