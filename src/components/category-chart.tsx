"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthData, CATEGORY_LABELS, CATEGORY_COLORS, ExpenseCategory } from "@/types/expense";
import { formatCurrency, getCategoryTotals } from "@/lib/utils";
import { useMobile } from "@/lib/use-mobile";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CategoryChartProps {
  data: MonthData[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const isMobile = useMobile();
  const categoryTotals = getCategoryTotals(data);
  const totalEgresos = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const chartData = Object.entries(categoryTotals)
    .map(([category, total]) => ({
      name: CATEGORY_LABELS[category as ExpenseCategory],
      value: total,
      color: CATEGORY_COLORS[category as ExpenseCategory],
      pct: ((total / totalEgresos) * 100).toFixed(1),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <section id="section-categorias" className="scroll-mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gasto por Categoría (acumulado)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Distribución del gasto total en {data.length} liquidaciones
          </p>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className={`${isMobile ? "h-[260px]" : "h-[320px]"} min-w-0 flex-1`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 90 : 120}
                    innerRadius={isMobile ? 40 : 55}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                    contentStyle={{
                      backgroundColor: "oklch(0.205 0 0)",
                      border: "1px solid oklch(1 0 0 / 10%)",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "oklch(0.9 0 0)",
                    }}
                    labelStyle={{ color: "oklch(0.7 0 0)" }}
                    itemStyle={{ color: "oklch(0.9 0 0)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend as list */}
            <div className="space-y-1.5 sm:w-[220px] shrink-0">
              {chartData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="flex-1 truncate text-muted-foreground">{entry.name}</span>
                  <span className="font-mono tabular-nums text-right">{entry.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
