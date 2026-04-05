"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCategoryTotals, formatPercent } from "@/lib/utils";
import { ExpenseCategory, type LiquidacionFull } from "@/types/expense";

// Promedios nacionales Febrero 2026 — Fuente: Octopus Proptech / Infobae
// https://www.infobae.com/economia/2026/03/12/las-expensas-subieron-3836-interanual/
const BENCHMARK = {
  expensaPromedioCaba: 318650,
  expensaPromedioGba: 155508,
  expensaPromedioNacional: 260353,
  inflacionInteranual: 33.1, // % — INDEC feb 2026
  expensasInteranualCaba: 38.4, // %
  expensasInteranualGba: 45.8, // %
  // Composición promedio nacional (% del total)
  categoryBenchmarks: {
    "sueldos-cargas": { label: "Sueldos + Cargas Sociales", percent: 32.0 },
    "servicios-publicos": { label: "Servicios Públicos", percent: 14.6 },
    "abonos-servicios": { label: "Abonos y Servicios", percent: 16.1 },
    mantenimiento: { label: "Mantenimiento", percent: 16.6 },
    reparaciones: { label: "Reparaciones", percent: 6.6 },
    administracion: { label: "Administración", percent: 5.75 },
    "seguros-gastos": { label: "Seguros", percent: 3.6 },
    "gastos-bancarios": { label: "Gastos Bancarios + Otros", percent: 2.6 },
  } as Record<string, { label: string; percent: number }>,
  // Honorarios administrador — AIERH Feb/Mar 2026
  // Clase C (servicios comunes), hasta 20 UF: $494,000 + $22,800 por UF adicional
  adminFeeAierh: 494000 + 4 * 22800, // 24 UF total = $585,200
  source: "Octopus Proptech / Infobae, Marzo 2026",
  sourceUrl:
    "https://www.infobae.com/economia/2026/03/12/las-expensas-subieron-3836-interanual-cual-es-el-valor-promedio-que-pagan-los-consorcios-argentinos/",
};

const NUM_APARTMENTS = 14; // UF con departamento (sin cocheras sueltas)

export function Benchmark({ data }: { data: LiquidacionFull[] }) {
  const lastMonth = data[data.length - 1];
  const firstMonth = data[0];

  // Expensa promedio por depto en este edificio
  const expensaPerUnit = lastMonth.expensasA / NUM_APARTMENTS;

  // Aumento acumulado en el período
  const aumentoAcumulado =
    ((lastMonth.expensasA - firstMonth.expensasA) / firstMonth.expensasA) * 100;

  // Composición por categoría (último mes)
  const lastMonthByCategory: Record<string, number> = {};
  for (const item of lastMonth.items) {
    lastMonthByCategory[item.category] =
      (lastMonthByCategory[item.category] || 0) + item.amount;
  }

  // Mapear a categorías agrupadas para comparar con benchmark
  const sueldosCargas =
    (lastMonthByCategory["sueldos"] || 0) +
    (lastMonthByCategory["cargas-sociales"] || 0);

  const ourCategories: { key: string; amount: number }[] = [
    { key: "sueldos-cargas", amount: sueldosCargas },
    {
      key: "servicios-publicos",
      amount: lastMonthByCategory["servicios-publicos"] || 0,
    },
    {
      key: "abonos-servicios",
      amount: lastMonthByCategory["abonos-servicios"] || 0,
    },
    { key: "mantenimiento", amount: lastMonthByCategory["mantenimiento"] || 0 },
    { key: "reparaciones", amount: lastMonthByCategory["reparaciones"] || 0 },
    {
      key: "administracion",
      amount: lastMonthByCategory["administracion"] || 0,
    },
    {
      key: "seguros-gastos",
      amount: lastMonthByCategory["seguros-gastos"] || 0,
    },
    {
      key: "gastos-bancarios",
      amount: lastMonthByCategory["gastos-bancarios"] || 0,
    },
  ];

  const totalEgresos = lastMonth.total;

  // Admin fee
  const adminFee = lastMonthByCategory["administracion"] || 0;
  const adminPercent = (adminFee / totalEgresos) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          ¿Pagamos más que otros edificios?
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Tu edificio vs promedios nacionales · {lastMonth.label} · Fuente: Octopus Proptech
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Expensa por unidad */}
        <div>
          <h3 className="text-sm font-medium mb-3">Expensa promedio por departamento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard
              label="Tu edificio"
              value={formatCurrency(expensaPerUnit)}
              sublabel={`${NUM_APARTMENTS} deptos`}
              highlight
            />
            <MetricCard
              label="Promedio CABA"
              value={formatCurrency(BENCHMARK.expensaPromedioCaba)}
              sublabel="Capital Federal"
            />
            <MetricCard
              label="Promedio GBA"
              value={formatCurrency(BENCHMARK.expensaPromedioGba)}
              sublabel="Gran Buenos Aires"
            />
          </div>
        </div>

        {/* Aumento vs inflación */}
        <div>
          <h3 className="text-sm font-medium mb-3">Aumento acumulado vs inflación</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard
              label="Tu edificio"
              value={`+${aumentoAcumulado.toFixed(1)}%`}
              sublabel={`${firstMonth.label} → ${lastMonth.label}`}
              highlight={aumentoAcumulado > BENCHMARK.inflacionInteranual}
            />
            <MetricCard
              label="Inflación (INDEC)"
              value={`+${BENCHMARK.inflacionInteranual}%`}
              sublabel="Interanual Feb 2026"
            />
            <MetricCard
              label="Expensas CABA"
              value={`+${BENCHMARK.expensasInteranualCaba}%`}
              sublabel="Interanual Feb 2026"
            />
          </div>
        </div>

        {/* Composición por categoría */}
        <div>
          <h3 className="text-sm font-medium mb-3">
            Composición por rubro ({lastMonth.label})
          </h3>
          <div className="space-y-2 overflow-x-auto">
            <div className="min-w-[380px]">
            <div className="grid grid-cols-[1fr_70px_70px_70px] gap-2 text-xs text-muted-foreground font-medium px-1">
              <span>Rubro</span>
              <span className="text-right">Tu edif.</span>
              <span className="text-right">Prom.</span>
              <span className="text-right">Dif.</span>
            </div>
            {ourCategories.map(({ key, amount }) => {
              const benchmark = BENCHMARK.categoryBenchmarks[key];
              if (!benchmark) return null;
              const ourPercent = (amount / totalEgresos) * 100;
              const diff = ourPercent - benchmark.percent;
              const isHigh = diff > 5;
              const isLow = diff < -5;

              return (
                <div
                  key={key}
                  className={`grid grid-cols-[1fr_70px_70px_70px] gap-2 items-center rounded px-2 py-1.5 text-sm ${
                    isHigh ? "bg-destructive/10" : ""
                  }`}
                >
                  <span className="text-sm">{benchmark.label}</span>
                  <span className="text-right font-mono text-sm">
                    {ourPercent.toFixed(1)}%
                  </span>
                  <span className="text-right font-mono text-sm text-muted-foreground">
                    {benchmark.percent.toFixed(1)}%
                  </span>
                  <span className="text-right">
                    <Badge
                      variant={isHigh ? "destructive" : isLow ? "secondary" : "outline"}
                      className="text-xs font-mono"
                    >
                      {diff > 0 ? "+" : ""}
                      {diff.toFixed(1)}pp
                    </Badge>
                  </span>
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Honorarios admin */}
        <div>
          <h3 className="text-sm font-medium mb-3">Honorarios de Administración</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard
              label="Andrade cobra"
              value={formatCurrency(adminFee)}
              sublabel={`${adminPercent.toFixed(1)}% del total`}
              highlight={false}
            />
            <MetricCard
              label="Sugerido AIERH"
              value={formatCurrency(BENCHMARK.adminFeeAierh)}
              sublabel="Clase C, 24 UF"
            />
            <MetricCard
              label="Promedio nacional"
              value="5.75%"
              sublabel="Octopus Proptech"
            />
          </div>
        </div>

        {/* Sources */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Fuentes: Octopus Proptech / Infobae (Mar 2026), AIERH honorarios
            (Feb-Mar 2026), INDEC IPC (Feb 2026).{" "}
            <a
              href={BENCHMARK.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Ver fuente principal
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  sublabel,
  highlight = false,
}: {
  label: string;
  value: string;
  sublabel: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight ? "border-destructive/50 bg-destructive/5" : "border-border"
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold font-mono mt-0.5">{value}</p>
      <p className="text-xs text-muted-foreground">{sublabel}</p>
    </div>
  );
}
