import { neon } from "@neondatabase/serverless";
import type { LiquidacionFull, ExpenseItem } from "@/types/expense";

function sql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(process.env.DATABASE_URL);
}

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

export async function getLiquidaciones(): Promise<LiquidacionFull[]> {
  const query = sql();
  const rows = await query`
    SELECT * FROM liquidaciones ORDER BY month ASC
  `;
  return rows.map((row) => ({
    month: row.month as string,
    label: row.label as string,
    total: Number(row.total),
    expensasA: Number(row.expensas_a),
    ufDiez: Number(row.uf_diez),
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

export async function saveLiquidacion(data: LiquidacionFull): Promise<void> {
  const query = sql();
  await query`
    INSERT INTO liquidaciones (month, label, total, expensas_a, uf_diez, items, periodo, vencimiento, cash_flow, prorrateo, egresos_por_seccion, aviso)
    VALUES (
      ${data.month},
      ${data.label},
      ${data.total},
      ${data.expensasA},
      ${data.ufDiez},
      ${JSON.stringify(data.items)}::jsonb,
      ${data.periodo ?? null},
      ${data.vencimiento ?? null},
      ${data.cashFlow ? JSON.stringify(data.cashFlow) : null}::jsonb,
      ${data.prorrateo ? JSON.stringify(data.prorrateo) : null}::jsonb,
      ${data.egresosPorSeccion ? JSON.stringify(data.egresosPorSeccion) : null}::jsonb,
      ${data.aviso ?? null}
    )
    ON CONFLICT (month) DO UPDATE SET
      label = EXCLUDED.label,
      total = EXCLUDED.total,
      expensas_a = EXCLUDED.expensas_a,
      uf_diez = EXCLUDED.uf_diez,
      items = EXCLUDED.items,
      periodo = EXCLUDED.periodo,
      vencimiento = EXCLUDED.vencimiento,
      cash_flow = EXCLUDED.cash_flow,
      prorrateo = EXCLUDED.prorrateo,
      egresos_por_seccion = EXCLUDED.egresos_por_seccion,
      aviso = EXCLUDED.aviso
  `;
}
