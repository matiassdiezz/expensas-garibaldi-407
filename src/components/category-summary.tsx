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
  getMonthCategoryTotal,
  getMonthOverMonthChange,
} from "@/lib/utils";

interface CategorySummaryProps {
  data: MonthData[];
  selectedCategory: ExpenseCategory | null;
  onSelectCategory: (cat: ExpenseCategory | null) => void;
}

export function CategorySummary({
  data,
  selectedCategory,
  onSelectCategory,
}: CategorySummaryProps) {
  const lastMonth = data[data.length - 1];
  const prevMonth = data.length > 1 ? data[data.length - 2] : null;
  const totalAcumulado = data.reduce((sum, m) => sum + m.total, 0);

  const categories = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];

  const rows = categories
    .map((cat) => {
      const acumulado = data.reduce(
        (sum, m) => sum + getMonthCategoryTotal(m, cat),
        0
      );
      const lastMonthTotal = getMonthCategoryTotal(lastMonth, cat);
      const prevMonthTotal = prevMonth
        ? getMonthCategoryTotal(prevMonth, cat)
        : 0;
      const variacion =
        prevMonth && prevMonthTotal > 0
          ? getMonthOverMonthChange(lastMonthTotal, prevMonthTotal)
          : null;
      const percent = (acumulado / totalAcumulado) * 100;

      return { cat, acumulado, lastMonthTotal, variacion, percent };
    })
    .filter((r) => r.acumulado > 0)
    .sort((a, b) => b.acumulado - a.acumulado);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumen por Categoría</CardTitle>
        <p className="text-xs text-muted-foreground">
          Acumulado {data.length} meses · Variación {prevMonth?.label.split(" ")[0]} → {lastMonth.label.split(" ")[0]}
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[420px]">
            <div className="grid grid-cols-[1fr_90px_55px_65px] gap-1 px-2 pb-2 text-xs text-muted-foreground font-medium">
              <span>Categoría</span>
              <span className="text-right">Acumulado</span>
              <span className="text-right">%</span>
              <span className="text-right">Var.</span>
            </div>
            {rows.map((row) => {
              const isSelected = selectedCategory === row.cat;
              return (
                <button
                  key={row.cat}
                  onClick={() =>
                    onSelectCategory(isSelected ? null : row.cat)
                  }
                  className={`w-full grid grid-cols-[1fr_90px_55px_65px] gap-1 items-center rounded px-2 py-2 text-sm transition-colors text-left ${
                    isSelected
                      ? "bg-primary/15 ring-1 ring-primary/30"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[row.cat] }}
                    />
                    <span className="text-xs sm:text-sm truncate">
                      {CATEGORY_LABELS[row.cat]}
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
                          row.variacion > 30
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs font-mono"
                      >
                        {formatPercent(row.variacion)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </span>
                </button>
              );
            })}
            <div className="grid grid-cols-[1fr_90px_55px_65px] gap-1 px-2 py-2 border-t border-border mt-1 font-medium">
              <span className="text-sm">Total</span>
              <span className="text-right font-mono text-sm">
                {formatCurrency(totalAcumulado)}
              </span>
              <span className="text-right font-mono text-xs text-muted-foreground">
                100%
              </span>
              <span />
            </div>
          </div>
        </div>
        {selectedCategory && (
          <p className="mt-3 text-xs text-muted-foreground">
            Filtrando detalle por{" "}
            <span className="font-medium text-foreground">
              {CATEGORY_LABELS[selectedCategory]}
            </span>
            {" · "}
            <button
              onClick={() => onSelectCategory(null)}
              className="underline hover:text-foreground"
            >
              Limpiar filtro
            </button>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
