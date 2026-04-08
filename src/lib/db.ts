import { neon } from "@neondatabase/serverless";
import type {
  LiquidacionFull,
  ExpenseItem,
  Building,
} from "@/types/expense";

function sql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(process.env.DATABASE_URL);
}

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// --- Buildings ---

export async function getBuildings(): Promise<Building[]> {
  const query = sql();
  const rows = await query`
    SELECT * FROM buildings ORDER BY created_at ASC
  `;
  return rows.map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    address: row.address as string,
    adminCompany: (row.admin_company as string) ?? undefined,
    cuit: (row.cuit as string) ?? undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
  }));
}

export async function getBuildingBySlug(
  slug: string
): Promise<Building | null> {
  const query = sql();
  const rows = await query`
    SELECT * FROM buildings WHERE slug = ${slug} LIMIT 1
  `;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    address: row.address as string,
    adminCompany: (row.admin_company as string) ?? undefined,
    cuit: (row.cuit as string) ?? undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

export async function createBuilding(data: {
  name: string;
  address: string;
  adminCompany?: string;
  cuit?: string;
}): Promise<Building> {
  const query = sql();
  const id = crypto.randomUUID();
  const slug = generateSlug(data.name);

  await query`
    INSERT INTO buildings (id, slug, name, address, admin_company, cuit)
    VALUES (
      ${id},
      ${slug},
      ${data.name},
      ${data.address},
      ${data.adminCompany ?? null},
      ${data.cuit ?? null}
    )
  `;

  return {
    id,
    slug,
    name: data.name,
    address: data.address,
    adminCompany: data.adminCompany,
    cuit: data.cuit,
  };
}

export interface BuildingSummary {
  buildingId: string;
  lastMonth: string;
  lastLabel: string;
  lastTotal: number;
  prevTotal: number | null;
  monthCount: number;
}

export async function getBuildingSummaries(): Promise<
  Record<string, BuildingSummary>
> {
  const query = sql();
  const rows = await query`
    WITH ranked AS (
      SELECT
        building_id,
        month,
        label,
        total,
        ROW_NUMBER() OVER (PARTITION BY building_id ORDER BY month DESC) AS rn,
        COUNT(*) OVER (PARTITION BY building_id) AS month_count
      FROM liquidaciones
    )
    SELECT
      r1.building_id,
      r1.month AS last_month,
      r1.label AS last_label,
      r1.total AS last_total,
      r2.total AS prev_total,
      r1.month_count
    FROM ranked r1
    LEFT JOIN ranked r2 ON r1.building_id = r2.building_id AND r2.rn = 2
    WHERE r1.rn = 1
  `;
  const result: Record<string, BuildingSummary> = {};
  for (const row of rows) {
    result[row.building_id as string] = {
      buildingId: row.building_id as string,
      lastMonth: row.last_month as string,
      lastLabel: row.last_label as string,
      lastTotal: Number(row.last_total),
      prevTotal: row.prev_total != null ? Number(row.prev_total) : null,
      monthCount: Number(row.month_count),
    };
  }
  return result;
}

// --- Liquidaciones ---

export async function getLiquidaciones(
  buildingId: string
): Promise<LiquidacionFull[]> {
  const query = sql();
  const rows = await query`
    SELECT * FROM liquidaciones
    WHERE building_id = ${buildingId}
    ORDER BY month ASC
  `;
  return rows.map((row) => ({
    buildingId: row.building_id as string,
    month: row.month as string,
    label: row.label as string,
    total: Number(row.total),
    expensasA: Number(row.expensas_a),
    items: (row.items as ExpenseItem[]) ?? [],
    periodo: (row.periodo as string) ?? undefined,
    vencimiento: (row.vencimiento as string) ?? undefined,
    cashFlow: (row.cash_flow as LiquidacionFull["cashFlow"]) ?? undefined,
    prorrateo: (row.prorrateo as LiquidacionFull["prorrateo"]) ?? undefined,
    egresosPorSeccion:
      (row.egresos_por_seccion as Record<string, number>) ?? undefined,
    aviso: (row.aviso as string) ?? undefined,
  }));
}

export async function saveLiquidacion(
  buildingId: string,
  data: LiquidacionFull
): Promise<void> {
  const query = sql();
  await query`
    INSERT INTO liquidaciones (building_id, month, label, total, expensas_a, items, periodo, vencimiento, cash_flow, prorrateo, egresos_por_seccion, aviso)
    VALUES (
      ${buildingId},
      ${data.month},
      ${data.label},
      ${data.total},
      ${data.expensasA},
      ${JSON.stringify(data.items)}::jsonb,
      ${data.periodo ?? null},
      ${data.vencimiento ?? null},
      ${data.cashFlow ? JSON.stringify(data.cashFlow) : null}::jsonb,
      ${data.prorrateo ? JSON.stringify(data.prorrateo) : null}::jsonb,
      ${data.egresosPorSeccion ? JSON.stringify(data.egresosPorSeccion) : null}::jsonb,
      ${data.aviso ?? null}
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
}
