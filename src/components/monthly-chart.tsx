"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LiquidacionFull } from "@/types/expense";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type ExpenseCategory,
} from "@/types/expense";
import {
  formatCurrency,
  formatPercent,
  getMonthCategoryTotal,
  getMonthOverMonthChange,
} from "@/lib/utils";
import { useMobile } from "@/lib/use-mobile";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlyChartProps {
  data: LiquidacionFull[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const isMobile = useMobile();

  const chartData = data.map((m) => {
    const [mes, anio] = m.label.split(" ");
    const short = mes.slice(0, 3);
    return {
      name: `${short} ${anio.slice(2)}`,
      egresos: m.total,
      ingresos: m.cashFlow?.ingresos ?? m.expensasA,
      caja: m.cashFlow?.saldoFinal ?? null,
    };
  });

  // Top 3 categories that grew the most (first month → last month)
  const firstMonth = data[0];
  const lastMonth = data[data.length - 1];
  const categories = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];

  const shortLabel = (cat: ExpenseCategory) =>
    CATEGORY_LABELS[cat].replace(/^[A-I] · /, "");

  const categoryGrowth = categories
    .map((cat) => {
      const first = getMonthCategoryTotal(firstMonth, cat);
      const last = getMonthCategoryTotal(lastMonth, cat);
      const change = first > 0 ? getMonthOverMonthChange(last, first) : null;
      return { cat, first, last, change };
    })
    .filter((c) => c.change !== null && c.first > 0 && c.last > 0)
    .sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
    .slice(0, 3);

  return (
    <section id="section-evolucion" className="scroll-mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            ¿Por qué suben las expensas?
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Evolución mensual — lo que se gasta, lo que se cobra, y lo que queda
          </p>
        </CardHeader>
        <CardContent className="space-y-5 min-w-0">
          <div className="h-[260px] min-w-0 sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 8,
                  right: isMobile ? 16 : 20,
                  bottom: isMobile ? 8 : 4,
                  left: isMobile ? 4 : 4,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(1 0 0 / 10%)"
                />
                <XAxis
                  dataKey="name"
                  stroke="oklch(0.7 0 0)"
                  fontSize={isMobile ? 9 : 11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  interval={isMobile ? 1 : 0}
                />
                <YAxis
                  stroke="oklch(0.7 0 0)"
                  fontSize={isMobile ? 9 : 10}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  width={isMobile ? 34 : 45}
                  tickFormatter={(value) =>
                    `${(value / 1000000).toFixed(1)}M`
                  }
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value))]}
                  contentStyle={{
                    backgroundColor: "oklch(0.205 0 0)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  labelStyle={{ color: "oklch(0.7 0 0)" }}
                />
                <Legend
                  iconSize={isMobile ? 8 : 10}
                  wrapperStyle={{
                    fontSize: isMobile ? "10px" : "11px",
                    paddingTop: isMobile ? "8px" : "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="egresos"
                  name="Egresos"
                  stroke="oklch(0.6 0.2 15)"
                  strokeWidth={2}
                  dot={{
                    fill: "oklch(0.6 0.2 15)",
                    r: isMobile ? 2.5 : 3.5,
                  }}
                  activeDot={{ r: isMobile ? 4 : 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  name="Ingresos reales"
                  stroke="oklch(0.65 0.15 250)"
                  strokeWidth={2}
                  dot={{
                    fill: "oklch(0.65 0.15 250)",
                    r: isMobile ? 2.5 : 3.5,
                  }}
                  activeDot={{ r: isMobile ? 4 : 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="caja"
                  name="Saldo en cuenta"
                  stroke="oklch(0.7 0.2 160)"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={{
                    fill: "oklch(0.7 0.2 160)",
                    r: isMobile ? 2.5 : 3.5,
                  }}
                  activeDot={{ r: isMobile ? 4 : 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top 3 rubros que más crecieron */}
          {categoryGrowth.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Lo que más creció en el período
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {categoryGrowth.map((c) => (
                  <div
                    key={c.cat}
                    className="flex items-center gap-2 rounded-lg border border-border p-2.5"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: CATEGORY_COLORS[c.cat],
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {shortLabel(c.cat)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatCurrency(c.first)} → {formatCurrency(c.last)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        (c.change ?? 0) > 50 ? "destructive" : "secondary"
                      }
                      className="text-xs font-mono shrink-0"
                    >
                      {formatPercent(c.change ?? 0)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
