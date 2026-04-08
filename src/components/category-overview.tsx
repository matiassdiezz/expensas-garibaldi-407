"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MonthData,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  ExpenseCategory,
} from "@/types/expense";
import {
  formatCurrency,
  formatPercent,
  getCategoryTotals,
  getMonthCategoryTotal,
  getMonthOverMonthChange,
} from "@/lib/utils";
import { useMobile } from "@/lib/use-mobile";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface CategoryOverviewProps {
  data: MonthData[];
}

export function CategoryOverview({ data }: CategoryOverviewProps) {
  const isMobile = useMobile();
  const lastMonth = data[data.length - 1];
  const prevMonth = data.length > 1 ? data[data.length - 2] : null;
  const categoryTotals = getCategoryTotals(data);
  const totalEgresos = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const rows = (Object.keys(CATEGORY_LABELS) as ExpenseCategory[])
    .map((cat) => {
      const acumulado = categoryTotals[cat] ?? 0;
      const lastMonthTotal = getMonthCategoryTotal(lastMonth, cat);
      const prevMonthTotal = prevMonth
        ? getMonthCategoryTotal(prevMonth, cat)
        : 0;
      const variacion =
        prevMonth && prevMonthTotal > 0
          ? getMonthOverMonthChange(lastMonthTotal, prevMonthTotal)
          : null;
      const percent = totalEgresos > 0 ? (acumulado / totalEgresos) * 100 : 0;

      return { cat, acumulado, lastMonthTotal, variacion, percent };
    })
    .filter((r) => r.acumulado > 0)
    .sort((a, b) => b.acumulado - a.acumulado);

  const chartData = rows.map((r) => ({
    name: CATEGORY_LABELS[r.cat],
    value: r.acumulado,
    color: CATEGORY_COLORS[r.cat],
    pct: r.percent.toFixed(1),
  }));

  // Friendly short label (drop the letter prefix)
  const shortLabel = (cat: ExpenseCategory) =>
    CATEGORY_LABELS[cat].replace(/^[A-I] · /, "");

  return (
    <section id="section-categorias" className="scroll-mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            ¿En qué se gastan las expensas?
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Distribución acumulada de {data.length} meses · Variación{" "}
            {prevMonth
              ? `${prevMonth.label.split(" ")[0]} → ${lastMonth.label.split(" ")[0]}`
              : ""}
          </p>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Pie chart */}
            <div
              className={`${isMobile ? "h-[220px]" : "h-[280px]"} min-w-0 sm:w-[280px] shrink-0`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 85 : 110}
                    innerRadius={isMobile ? 38 : 50}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "Total",
                    ]}
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

            {/* Category table */}
            <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="grid grid-cols-[1fr_100px_50px_65px] gap-x-3 px-2 pb-2 text-xs text-muted-foreground font-medium">
                    <span>Rubro</span>
                    <span className="text-right">Acumulado</span>
                    <span className="text-right">%</span>
                    <span className="text-right">Var.</span>
                  </div>
                  {rows.map((row) => (
                    <div
                      key={row.cat}
                      className="grid grid-cols-[1fr_100px_50px_65px] gap-x-3 items-center rounded px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: CATEGORY_COLORS[row.cat],
                          }}
                        />
                        <span className="text-xs sm:text-sm truncate">
                          {shortLabel(row.cat)}
                        </span>
                      </span>
                      <span className="text-right font-mono text-xs">
                        {formatCurrency(row.acumulado)}
                      </span>
                      <span className="text-right font-mono text-xs text-muted-foreground">
                        {row.percent.toFixed(1)}%
                      </span>
                      <span className="text-right">
                        {row.variacion !== null ? (
                          <Badge
                            variant={
                              row.variacion > 30 ? "destructive" : "secondary"
                            }
                            className="text-xs font-mono"
                          >
                            {formatPercent(row.variacion)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                  <div className="grid grid-cols-[1fr_100px_50px_65px] gap-x-3 px-2 py-2 border-t border-border mt-1 font-medium">
                    <span className="text-sm">Total</span>
                    <span className="text-right font-mono text-sm">
                      {formatCurrency(totalEgresos)}
                    </span>
                    <span className="text-right font-mono text-xs text-muted-foreground">
                      100%
                    </span>
                    <span />
                  </div>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
