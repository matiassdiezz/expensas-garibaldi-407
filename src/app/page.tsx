import { Dashboard } from "@/components/dashboard";
import { getLiquidaciones, isDbConfigured } from "@/lib/db";
import type { LiquidacionFull } from "@/types/expense";

// Static fallback — used when DATABASE_URL is not configured
import { expensasData } from "@/lib/data";
import liquidacionesRaw from "@/lib/liquidaciones.json";

function mergeStaticData(): LiquidacionFull[] {
  const liquidaciones = (
    liquidacionesRaw as { liquidaciones: Array<Record<string, unknown>> }
  ).liquidaciones;

  return expensasData.map((md) => {
    const liq = liquidaciones.find(
      (l) => l.liquidacion === md.month
    ) as Record<string, unknown> | undefined;
    return {
      ...md,
      periodo: liq?.periodo as string | undefined,
      vencimiento: liq?.vencimiento as string | undefined,
      cashFlow: liq?.cashFlow as LiquidacionFull["cashFlow"],
      prorrateo: liq?.prorrateo as LiquidacionFull["prorrateo"],
      egresosPorSeccion: (
        liq?.egresos as { secciones: Record<string, number> } | undefined
      )?.secciones,
      aviso: liq?.aviso as string | undefined,
    };
  });
}

export default async function Home() {
  let data: LiquidacionFull[];

  if (isDbConfigured()) {
    data = await getLiquidaciones();
  } else {
    data = mergeStaticData();
  }

  return (
    <main className="flex-1">
      <Dashboard data={data} />
    </main>
  );
}
