"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonthData, CATEGORY_LABELS, ExpenseCategory } from "@/types/expense";
import {
  formatCurrency,
  formatPercent,
  getMonthCategoryTotal,
  getMonthOverMonthChange,
} from "@/lib/utils";

interface PendingInstallment {
  description: string;
  category: ExpenseCategory;
  amount: number;
  current: number;
  total: number;
  remaining: number;
}

interface ForecastProps {
  data: MonthData[];
  unitPercent?: number;
}

function parseInstallments(lastMonth: MonthData): PendingInstallment[] {
  const pending: PendingInstallment[] = [];

  for (const item of lastMonth.items) {
    // Match "Cuota X/Y" pattern
    const match = item.description.match(/[Cc]uota\s+(\d+)\s*\/\s*(\d+)/);
    if (match) {
      const current = parseInt(match[1]);
      const total = parseInt(match[2]);
      const remaining = total - current;
      if (remaining > 0) {
        pending.push({
          description: item.description.replace(/\s*\(Cuota.*?\)/, "").replace(/\s*Cuota.*$/, "").trim(),
          category: item.category,
          amount: item.amount,
          current,
          total,
          remaining,
        });
      }
    }
  }

  return pending;
}

function getRecurringEstimate(
  data: MonthData[],
  category: ExpenseCategory,
  months: number = 3
): number {
  const recent = data.slice(-months);
  const totals = recent.map((m) => getMonthCategoryTotal(m, category));
  const nonZero = totals.filter((t) => t > 0);
  if (nonZero.length === 0) return 0;
  return Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length);
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getNextMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${MONTH_NAMES[nextMonth - 1]} ${nextYear}`;
}

export function Forecast({ data, unitPercent }: ForecastProps) {
  const lastMonth = data[data.length - 1];
  const prevMonth = data.length > 1 ? data[data.length - 2] : null;
  const nextMonthLabel = getNextMonthLabel(lastMonth.month);

  // 1. Pending installments
  const pendingInstallments = parseInstallments(lastMonth);
  const totalPendingInstallments = pendingInstallments.reduce(
    (sum, p) => sum + p.amount * p.remaining,
    0
  );

  // Next month installments (just 1 cuota each)
  const nextMonthInstallments = pendingInstallments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  // 2. Recurring expenses by category (avg last 3 months)
  const categories = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];

  // Categories that are "base" recurring (appear almost every month)
  const recurringCategories = categories.filter((cat) => {
    const appearances = data.slice(-6).filter(
      (m) => getMonthCategoryTotal(m, cat) > 0
    ).length;
    return appearances >= 4; // appears in at least 4 of last 6 months
  });

  // For recurring categories, exclude installment items from the estimate
  // since we count those separately
  const installmentDescriptions = new Set(
    pendingInstallments.map((p) => p.category)
  );

  const recurringEstimates = recurringCategories.map((cat) => {
    const avg = getRecurringEstimate(data, cat);
    const lastTotal = getMonthCategoryTotal(lastMonth, cat);
    return { category: cat, estimate: avg, lastMonth: lastTotal };
  });

  // Total estimated (recurring base)
  const totalRecurringEstimate = recurringEstimates.reduce(
    (sum, r) => sum + r.estimate,
    0
  );

  // The installments are already included in the recurring average for their
  // categories, but we highlight them separately so users know they're coming.
  // So the total forecast is just the recurring estimate.
  const totalForecast = totalRecurringEstimate;

  const vsLastMonth = getMonthOverMonthChange(totalForecast, lastMonth.total);
  const forecastUnit = unitPercent
    ? Math.round(totalForecast * (unitPercent / 100))
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          ¿Cuánto viene el mes que viene?
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Proyección {nextMonthLabel} · promedio de últimos 3 meses + cuotas pendientes
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Headline */}
        <div className={`grid grid-cols-1 gap-3 ${forecastUnit !== null ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">Egresos estimados</p>
            <p className="text-base sm:text-lg font-bold font-mono mt-0.5">
              {formatCurrency(totalForecast)}
            </p>
            {prevMonth && (
              <Badge
                variant={vsLastMonth > 10 ? "destructive" : "secondary"}
                className="text-xs font-mono mt-1"
              >
                {formatPercent(vsLastMonth)} vs {lastMonth.label.split(" ")[0]}
              </Badge>
            )}
          </div>
          {forecastUnit !== null && (
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">
                Tu expensa estimada ({unitPercent}%)
              </p>
              <p className="text-base sm:text-lg font-bold font-mono mt-0.5">
                {formatCurrency(forecastUnit)}
              </p>
            </div>
          )}
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Cuotas pendientes</p>
            <p className="text-base sm:text-lg font-bold font-mono mt-0.5">
              {formatCurrency(totalPendingInstallments)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              en {pendingInstallments.reduce((s, p) => s + p.remaining, 0)} cuotas futuras
            </p>
          </div>
        </div>

        {/* Pending installments */}
        {pendingInstallments.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">
              Cuotas pendientes conocidas
            </h3>
            <div className="space-y-2">
              {pendingInstallments.map((p, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm break-words">{p.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {CATEGORY_LABELS[p.category].split(" · ")[1]} · Cuota {p.current}/{p.total}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-medium">
                      {formatCurrency(p.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ×{p.remaining} restante{p.remaining > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recurring breakdown */}
        <div>
          <h3 className="text-sm font-medium mb-3">
            Estimado por categoría
            <span className="text-xs font-normal text-muted-foreground ml-2">
              promedio últimos 3 meses
            </span>
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-[380px]">
              <div className="grid grid-cols-[1fr_90px_90px_65px] gap-1 px-2 pb-2 text-xs text-muted-foreground font-medium">
                <span>Categoría</span>
                <span className="text-right">Estimado</span>
                <span className="text-right">Último mes</span>
                <span className="text-right">Dif.</span>
              </div>
              {recurringEstimates
                .sort((a, b) => b.estimate - a.estimate)
                .map((r) => {
                  const diff =
                    r.lastMonth > 0
                      ? getMonthOverMonthChange(r.estimate, r.lastMonth)
                      : 0;
                  return (
                    <div
                      key={r.category}
                      className="grid grid-cols-[1fr_90px_90px_65px] gap-1 items-center rounded px-2 py-1.5 text-sm"
                    >
                      <span className="text-xs sm:text-sm">
                        {CATEGORY_LABELS[r.category].split(" · ")[1]}
                      </span>
                      <span className="text-right font-mono text-xs">
                        {formatCurrency(r.estimate)}
                      </span>
                      <span className="text-right font-mono text-xs text-muted-foreground">
                        {formatCurrency(r.lastMonth)}
                      </span>
                      <span className="text-right">
                        {r.lastMonth > 0 ? (
                          <Badge
                            variant={
                              Math.abs(diff) > 20 ? "destructive" : "secondary"
                            }
                            className="text-xs font-mono"
                          >
                            {formatPercent(diff)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              <div className="grid grid-cols-[1fr_90px_90px_65px] gap-1 px-2 py-2 border-t border-border mt-1 font-medium">
                <span className="text-xs sm:text-sm">Total</span>
                <span className="text-right font-mono text-xs sm:text-sm">
                  {formatCurrency(totalRecurringEstimate)}
                </span>
                <span className="text-right font-mono text-xs sm:text-sm text-muted-foreground">
                  {formatCurrency(lastMonth.total)}
                </span>
                <span />
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Proyección basada en promedios históricos. Los gastos reales pueden
          variar por reparaciones extraordinarias, ajustes salariales, o cambios
          en servicios. Las cuotas pendientes están incluidas en el estimado por
          categoría.
        </p>
      </CardContent>
    </Card>
  );
}
