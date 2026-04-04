"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonthData } from "@/types/expense";
import { cn, formatCurrency, formatPercent, getMonthOverMonthChange } from "@/lib/utils";

interface SummaryCardsProps {
  data: MonthData[];
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
  const totalEgresos = data.reduce((sum, m) => sum + m.total, 0);
  const promedioEgresos = totalEgresos / data.length;

  // Variación expensas A (prorrateo) primer vs último mes
  const expensasAFirst = data[0].expensasA;
  const expensasALast = data[data.length - 1].expensasA;
  const variacionExpensasA = getMonthOverMonthChange(expensasALast, expensasAFirst);

  // Mes con mayor gasto
  const mesMasCaro = data.reduce((max, m) => (m.total > max.total ? m : max), data[0]);

  // Total cobrado vs gastado
  const totalCobrado = data.reduce((sum, m) => sum + m.expensasA, 0);
  const balance = totalCobrado - totalEgresos;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCardLink
        href="#section-categorias"
        ariaLabel="Ir a gasto por categoría acumulado"
      >
        <Card className="h-full cursor-pointer transition-shadow group-hover/summary:shadow-md group-hover/summary:ring-foreground/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Egresos ({data.length} meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono">{formatCurrency(totalEgresos)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio: {formatCurrency(promedioEgresos)}/mes
            </p>
          </CardContent>
        </Card>
      </SummaryCardLink>

      <SummaryCardLink
        href="#section-evolucion"
        ariaLabel="Ir a gráfico de evolución"
      >
        <Card className="h-full cursor-pointer transition-shadow group-hover/summary:shadow-md group-hover/summary:ring-foreground/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expensas Ordinarias (A)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono">{formatCurrency(expensasALast)}</div>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant={variacionExpensasA > 0 ? "destructive" : "secondary"} className="text-xs">
                {formatPercent(variacionExpensasA)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                desde {formatCurrency(expensasAFirst)}
              </span>
            </div>
          </CardContent>
        </Card>
      </SummaryCardLink>

      <SummaryCardLink href="#section-balance" ariaLabel="Ir a balance cobrado vs gastado">
        <Card className="h-full cursor-pointer transition-shadow group-hover/summary:shadow-md group-hover/summary:ring-foreground/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance (cobrado − gastado)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold font-mono ${balance < 0 ? "text-red-400" : "text-emerald-400"}`}>
              {balance >= 0 ? "+" : ""}{formatCurrency(balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cobrado: {formatCurrency(totalCobrado)}
            </p>
          </CardContent>
        </Card>
      </SummaryCardLink>

      <SummaryCardLink
        href="#section-detalle"
        ariaLabel="Ir a detalle de gastos por mes"
      >
        <Card className="h-full cursor-pointer transition-shadow group-hover/summary:shadow-md group-hover/summary:ring-foreground/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mes Más Caro (egresos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono">{formatCurrency(mesMasCaro.total)}</div>
            <p className="text-xs text-muted-foreground mt-1">{mesMasCaro.label}</p>
          </CardContent>
        </Card>
      </SummaryCardLink>
    </div>
  );
}
