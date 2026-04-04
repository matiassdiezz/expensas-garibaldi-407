"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonthData } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
import { useMobile } from "@/lib/use-mobile";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface BalanceTrackerProps {
  data: MonthData[];
}

export function BalanceTracker({ data }: BalanceTrackerProps) {
  const isMobile = useMobile();

  // Calculate monthly and cumulative balance
  let cumulative = 0;
  const balanceData = data.map((m) => {
    const cobrado = m.expensasA;
    const gastado = m.total;
    const saldo = cobrado - gastado;
    cumulative += saldo;
    return {
      name: m.label.split(" ")[0].slice(0, 3),
      fullLabel: m.label,
      cobrado,
      gastado,
      saldo,
      acumulado: cumulative,
    };
  });

  const totalCobrado = data.reduce((s, m) => s + m.expensasA, 0);
  const totalGastado = data.reduce((s, m) => s + m.total, 0);
  const balanceFinal = totalCobrado - totalGastado;
  const isPositive = balanceFinal >= 0;

  // Months with deficit (gastaron más de lo que cobraron)
  const deficitMonths = balanceData.filter((b) => b.saldo < 0);
  const surplusMonths = balanceData.filter((b) => b.saldo > 0);

  // Biggest surplus and deficit months
  const biggestSurplus = surplusMonths.length > 0
    ? surplusMonths.reduce((max, b) => (b.saldo > max.saldo ? b : max))
    : null;
  const biggestDeficit = deficitMonths.length > 0
    ? deficitMonths.reduce((min, b) => (b.saldo < min.saldo ? b : min))
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Balance: ¿A dónde va la diferencia?
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Expensas cobradas (A) vs egresos reales · {data.length} meses
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Headline cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Total cobrado</p>
            <p className="text-lg font-bold font-mono mt-0.5">
              {formatCurrency(totalCobrado)}
            </p>
            <p className="text-xs text-muted-foreground">Expensas A acum.</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Total gastado</p>
            <p className="text-lg font-bold font-mono mt-0.5">
              {formatCurrency(totalGastado)}
            </p>
            <p className="text-xs text-muted-foreground">Egresos reales</p>
          </div>
          <div
            className={`rounded-lg border p-3 ${
              isPositive
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-destructive/50 bg-destructive/5"
            }`}
          >
            <p className="text-xs text-muted-foreground">
              {isPositive ? "Superávit acumulado" : "Déficit acumulado"}
            </p>
            <p className="text-lg font-bold font-mono mt-0.5">
              {formatCurrency(Math.abs(balanceFinal))}
            </p>
            <p className="text-xs text-muted-foreground">
              {isPositive
                ? "La administración debería tener este saldo"
                : "Se gastó más de lo cobrado"}
            </p>
          </div>
        </div>

        {/* Callout */}
        {isPositive && balanceFinal > 500000 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-200">
              Hay {formatCurrency(balanceFinal)} de diferencia entre lo cobrado y
              lo gastado.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ese saldo debería estar en el fondo de reserva del consorcio o
              reflejado en la próxima liquidación. Si no aparece, preguntá a la
              administración.
            </p>
          </div>
        )}

        {/* Chart: cumulative balance over time */}
        <div>
          <h3 className="text-sm font-medium mb-3">Balance acumulado</h3>
          <div className="h-[200px] min-w-0 sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={balanceData}
                margin={{
                  top: 8,
                  right: isMobile ? 16 : 12,
                  bottom: isMobile ? 8 : 4,
                  left: isMobile ? 4 : 4,
                }}
              >
                <defs>
                  <linearGradient id="balanceGradientPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.7 0.18 160)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.7 0.18 160)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="balanceGradientNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.6 0.2 15)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.6 0.2 15)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
                <XAxis
                  dataKey="name"
                  stroke="oklch(0.7 0 0)"
                  fontSize={isMobile ? 10 : 11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  padding={{ left: isMobile ? 8 : 15, right: isMobile ? 8 : 15 }}
                />
                <YAxis
                  stroke="oklch(0.7 0 0)"
                  fontSize={isMobile ? 9 : 10}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  width={isMobile ? 38 : 50}
                  tickFormatter={(value) => {
                    const abs = Math.abs(value);
                    if (abs >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    return `${(value / 1000).toFixed(0)}k`;
                  }}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Balance acumulado"]}
                  contentStyle={{
                    backgroundColor: "oklch(0.205 0 0)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  labelStyle={{ color: "oklch(0.7 0 0)" }}
                />
                <ReferenceLine y={0} stroke="oklch(0.5 0 0)" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  stroke={isPositive ? "oklch(0.7 0.18 160)" : "oklch(0.6 0.2 15)"}
                  strokeWidth={2}
                  fill={isPositive ? "url(#balanceGradientPos)" : "url(#balanceGradientNeg)"}
                  dot={{
                    fill: isPositive ? "oklch(0.7 0.18 160)" : "oklch(0.6 0.2 15)",
                    r: isMobile ? 3 : 4,
                  }}
                  activeDot={{ r: isMobile ? 5 : 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Month-by-month breakdown */}
        <div>
          <h3 className="text-sm font-medium mb-3">Detalle mes a mes</h3>

          {/* Mobile: stacked cards */}
          <div className="space-y-2 sm:hidden">
            {balanceData.map((row) => (
              <div
                key={row.fullLabel}
                className={`rounded-lg border border-border p-3 ${
                  row.saldo < 0 ? "bg-destructive/5" : ""
                }`}
              >
                <p className="text-xs font-medium">{row.fullLabel}</p>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Cobrado
                    </p>
                    <p className="font-mono text-xs tabular-nums">
                      {formatCurrency(row.cobrado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Gastado
                    </p>
                    <p className="font-mono text-xs tabular-nums">
                      {formatCurrency(row.gastado)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Saldo mes</p>
                    <p className="font-mono text-xs tabular-nums">
                      {row.saldo >= 0 ? "+" : ""}
                      {formatCurrency(row.saldo)}
                    </p>
                  </div>
                  <Badge
                    variant={row.acumulado < 0 ? "destructive" : "secondary"}
                    className="text-xs font-mono"
                  >
                    Acum: {formatCurrency(row.acumulado)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block rounded-lg border border-border overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-[1fr_90px_90px_90px_90px] gap-1 p-3 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>Mes</span>
                <span className="text-right">Cobrado</span>
                <span className="text-right">Gastado</span>
                <span className="text-right">Saldo</span>
                <span className="text-right">Acumulado</span>
              </div>
              {balanceData.map((row) => (
                <div
                  key={row.fullLabel}
                  className={`grid grid-cols-[1fr_90px_90px_90px_90px] gap-1 p-3 border-t border-border text-sm ${
                    row.saldo < 0 ? "bg-destructive/5" : ""
                  }`}
                >
                  <span className="text-xs">{row.fullLabel}</span>
                  <span className="text-right font-mono text-xs">
                    {formatCurrency(row.cobrado)}
                  </span>
                  <span className="text-right font-mono text-xs">
                    {formatCurrency(row.gastado)}
                  </span>
                  <span
                    className={`text-right font-mono text-xs ${
                      row.saldo < 0 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {row.saldo >= 0 ? "+" : ""}
                    {formatCurrency(row.saldo)}
                  </span>
                  <span className="text-right">
                    <Badge
                      variant={row.acumulado < 0 ? "destructive" : "secondary"}
                      className="text-xs font-mono"
                    >
                      {formatCurrency(row.acumulado)}
                    </Badge>
                  </span>
                </div>
              ))}
              {/* Total row */}
              <div className="grid grid-cols-[1fr_90px_90px_90px_90px] gap-1 p-3 border-t border-border bg-muted/30 font-medium">
                <span className="text-sm">Total</span>
                <span className="text-right font-mono text-sm">
                  {formatCurrency(totalCobrado)}
                </span>
                <span className="text-right font-mono text-sm">
                  {formatCurrency(totalGastado)}
                </span>
                <span
                  className={`text-right font-mono text-sm ${
                    balanceFinal < 0 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {balanceFinal >= 0 ? "+" : ""}
                  {formatCurrency(balanceFinal)}
                </span>
                <span />
              </div>
            </div>
          </div>
        </div>

        {/* Key insights */}
        <div className="border-t border-border pt-4 space-y-2">
          <h3 className="text-sm font-medium">Datos clave</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>
              De {data.length} meses, en{" "}
              <span className="text-foreground font-medium">
                {deficitMonths.length}
              </span>{" "}
              se gastó más de lo cobrado y en{" "}
              <span className="text-foreground font-medium">
                {surplusMonths.length}
              </span>{" "}
              sobró plata.
            </li>
            {biggestSurplus && (
              <li>
                Mayor superávit:{" "}
                <span className="text-emerald-400 font-mono">
                  +{formatCurrency(biggestSurplus.saldo)}
                </span>{" "}
                en {biggestSurplus.fullLabel}
              </li>
            )}
            {biggestDeficit && (
              <li>
                Mayor déficit:{" "}
                <span className="text-red-400 font-mono">
                  {formatCurrency(biggestDeficit.saldo)}
                </span>{" "}
                en {biggestDeficit.fullLabel}
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
