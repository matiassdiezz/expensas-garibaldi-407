"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LiquidacionFull } from "@/types/expense";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type ExpenseCategory,
} from "@/types/expense";
import {
  cn,
  formatCurrency,
  formatPercent,
  getMonthOverMonthChange,
  getMonthCategoryTotal,
} from "@/lib/utils";

interface SummaryCardsProps {
  data: LiquidacionFull[];
}

function SummaryCardLink({
  href,
  ariaLabel,
  children,
}: {
  href: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "group/summary block rounded-xl text-inherit no-underline outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      {children}
    </a>
  );
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const lastMonth = data[data.length - 1];
  const prevMonth = data.length > 1 ? data[data.length - 2] : null;

  // 1. Expensa actual + variación
  const expensasALast = lastMonth.expensasA;
  const expensasAChange = prevMonth
    ? getMonthOverMonthChange(expensasALast, prevMonth.expensasA)
    : 0;

  // 2. Mayor rubro (categoría con más peso en último mes)
  const categories = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];
  const categoryTotalsLastMonth = categories.map((cat) => ({
    cat,
    total: getMonthCategoryTotal(lastMonth, cat),
  }));
  const topCategory = categoryTotalsLastMonth.reduce((max, c) =>
    c.total > max.total ? c : max
  );
  const topCatPercent = lastMonth.total > 0
    ? (topCategory.total / lastMonth.total) * 100
    : 0;
  const shortLabel = (cat: ExpenseCategory) =>
    CATEGORY_LABELS[cat].replace(/^[A-I] · /, "");

  // 3. Lo que más subió (mayor variación % vs mes anterior)
  let biggestRise: {
    cat: ExpenseCategory;
    change: number;
    amount: number;
  } | null = null;
  if (prevMonth) {
    for (const cat of categories) {
      const current = getMonthCategoryTotal(lastMonth, cat);
      const previous = getMonthCategoryTotal(prevMonth, cat);
      if (previous > 0 && current > 0) {
        const change = getMonthOverMonthChange(current, previous);
        if (!biggestRise || change > biggestRise.change) {
          biggestRise = { cat, change, amount: current };
        }
      }
    }
  }

  // 4. Estado del edificio — superávit o déficit
  const totalCobrado = data.reduce(
    (s, m) => s + (m.cashFlow?.ingresos ?? m.expensasA),
    0
  );
  const totalGastado = data.reduce((s, m) => s + m.total, 0);
  const balance = totalCobrado - totalGastado;
  const isPositive = balance >= 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Expensa actual */}
      <SummaryCardLink
        href="#section-evolucion"
        ariaLabel="Ver evolución de expensas"
      >
        <Card className="h-full cursor-pointer transition-shadow group-hover/summary:shadow-md group-hover/summary:ring-foreground/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expensas del edificio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono">
              {formatCurrency(expensasALast)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {prevMonth && (
                <Badge
                  variant={expensasAChange > 0 ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {formatPercent(expensasAChange)}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {lastMonth.label}
              </span>
            </div>
          </CardContent>
        </Card>
      </SummaryCardLink>

      {/* Mayor rubro */}
      <SummaryCardLink
        href="#section-categorias"
        ariaLabel="Ver distribución por categoría"
      >
        <Card className="h-full cursor-pointer transition-shadow group-hover/summary:shadow-md group-hover/summary:ring-foreground/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mayor gasto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor: CATEGORY_COLORS[topCategory.cat],
                }}
              />
              <span className="text-base sm:text-lg font-bold truncate">
                {shortLabel(topCategory.cat)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {topCatPercent.toFixed(0)}% del gasto total ·{" "}
              {formatCurrency(topCategory.total)}
            </p>
          </CardContent>
        </Card>
      </SummaryCardLink>

      {/* Lo que más subió */}
      <SummaryCardLink
        href="#section-evolucion"
        ariaLabel="Ver qué rubros subieron más"
      >
        <Card className="h-full cursor-pointer transition-shadow group-hover/summary:shadow-md group-hover/summary:ring-foreground/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lo que más subió
            </CardTitle>
          </CardHeader>
          <CardContent>
            {biggestRise ? (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: CATEGORY_COLORS[biggestRise.cat],
                    }}
                  />
                  <span className="text-base sm:text-lg font-bold truncate">
                    {shortLabel(biggestRise.cat)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="destructive" className="text-xs">
                    {formatPercent(biggestRise.change)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    vs mes anterior
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos previos</p>
            )}
          </CardContent>
        </Card>
      </SummaryCardLink>

      {/* Estado del edificio */}
      <SummaryCardLink
        href="#section-balance"
        ariaLabel="Ver balance del edificio"
      >
        <Card className="h-full cursor-pointer transition-shadow group-hover/summary:shadow-md group-hover/summary:ring-foreground/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Las cuentas del edificio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono ${
                isPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isPositive ? "Sobró" : "Faltó"} plata en {data.length} meses
            </p>
          </CardContent>
        </Card>
      </SummaryCardLink>
    </div>
  );
}
