"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LiquidacionFull } from "@/types/expense";
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
  LineChart,
  Line,
} from "recharts";

interface BalanceTrackerProps {
  data: LiquidacionFull[];
}

export function BalanceTracker({ data }: BalanceTrackerProps) {
  const isMobile = useMobile();

  // Calculate monthly and cumulative balance (theoretical: expensasA vs egresos)
  let cumulative = 0;
  const balanceData = data.map((m) => {
    const cobrado = m.expensasA;
    const gastado = m.total;
    const saldo = cobrado - gastado;
    cumulative += saldo;

    const saldoCaja = m.cashFlow?.saldoFinal ?? null;
    const ingresosReales = m.cashFlow?.ingresos ?? null;
    const extras = m.cashFlow?.extras ?? [];

    return {
      name: `${m.label.split(" ")[0].slice(0, 3)} ${m.label.split(" ")[1]?.slice(2) ?? ""}`,
      fullLabel: m.label,
      cobrado,
      gastado,
      saldo,
      acumulado: cumulative,
      saldoCaja,
      ingresosReales,
      hasExtras: extras.length > 0,
      extrasDesc: extras.map((e) => e.descripcion).join("; "),
    };
  });

  const totalCobrado = data.reduce((s, m) => s + m.expensasA, 0);
  const totalGastado = data.reduce((s, m) => s + m.total, 0);
  const balanceFinal = totalCobrado - totalGastado;
  const isPositive = balanceFinal >= 0;

  // Real cash balance (last month with data)
  const lastWithCash = [...balanceData].reverse().find((b) => b.saldoCaja !== null);
  const saldoCajaActual = lastWithCash?.saldoCaja ?? null;

  // Months with deficit
  const deficitMonths = balanceData.filter((b) => b.saldo < 0);
  const surplusMonths = balanceData.filter((b) => b.saldo > 0);

  const biggestSurplus = surplusMonths.length > 0
    ? surplusMonths.reduce((max, b) => (b.saldo > max.saldo ? b : max))
    : null;
  const biggestDeficit = deficitMonths.length > 0
    ? deficitMonths.reduce((min, b) => (b.saldo < min.saldo ? b : min))
    : null;

  // Lowest cash balance ever
  const withCash = balanceData.filter((b) => b.saldoCaja !== null);
  const lowestCash = withCash.length > 0
    ? withCash.reduce((min, b) => (b.saldoCaja! < min.saldoCaja! ? b : min))
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Balance: ¿A dónde va la diferencia?
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Expensas cobradas (A) vs egresos reales · {data.length} meses ·
          Datos de caja extraídos de las liquidaciones oficiales
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Headline cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Total cobrado</p>
            <p className="text-base sm:text-lg font-bold font-mono mt-0.5">
              {formatCurrency(totalCobrado)}
            </p>
            <p className="text-xs text-muted-foreground">Exp. A acumuladas</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Total gastado</p>
            <p className="text-base sm:text-lg font-bold font-mono mt-0.5">
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
              {isPositive ? "Superávit teórico" : "Déficit teórico"}
            </p>
            <p className="text-base sm:text-lg font-bold font-mono mt-0.5">
              {formatCurrency(Math.abs(balanceFinal))}
            </p>
            <p className="text-xs text-muted-foreground">
              Cobrado − gastado
            </p>
          </div>
          {saldoCajaActual !== null && (
            <div
              className={`rounded-lg border p-3 ${
                saldoCajaActual < 200000
                  ? "border-destructive/50 bg-destructive/5"
                  : "border-border"
              }`}
            >
              <p className="text-xs text-muted-foreground">Saldo real en caja</p>
              <p className="text-base sm:text-lg font-bold font-mono mt-0.5">
                {formatCurrency(saldoCajaActual)}
              </p>
              <p className="text-xs text-muted-foreground">
                {lastWithCash?.fullLabel}
              </p>
            </div>
          )}
        </div>

        {/* Callout: theoretical surplus vs actual cash */}
        {isPositive && saldoCajaActual !== null && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-200">
              Teóricamente deberían sobrar {formatCurrency(balanceFinal)}.
              En caja hay {formatCurrency(saldoCajaActual)}.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              La diferencia puede explicarse por pagos atrasados de vecinos,
              ingresos de meses anteriores, o gastos no reflejados.
              Pedí el detalle del estado de cuenta al administrador.
            </p>
          </div>
        )}

        {/* Chart: real cash balance over time */}
        {withCash.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">
              Saldo real en caja
              <span className="text-xs font-normal text-muted-foreground ml-2">
                según Resumen de Movimientos de Caja de cada liquidación
              </span>
            </h3>
            <div className="h-[180px] min-w-0 sm:h-[220px]">
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
                    <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.15 250)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.65 0.15 250)" stopOpacity={0} />
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
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      return `${(value / 1000).toFixed(0)}k`;
                    }}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Saldo en caja"]}
                    contentStyle={{
                      backgroundColor: "oklch(0.205 0 0)",
                      border: "1px solid oklch(1 0 0 / 10%)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                    labelStyle={{ color: "oklch(0.7 0 0)" }}
                  />
                  <ReferenceLine
                    y={200000}
                    stroke="oklch(0.6 0.2 15 / 50%)"
                    strokeDasharray="5 5"
                    label={{
                      value: isMobile ? "" : "Zona crítica",
                      position: "right",
                      fontSize: 10,
                      fill: "oklch(0.6 0.2 15)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="saldoCaja"
                    stroke="oklch(0.65 0.15 250)"
                    strokeWidth={2}
                    fill="url(#cashGradient)"
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (cx == null || cy == null || payload.saldoCaja === null) return <g key={cx} />;
                      const isCritical = payload.saldoCaja < 200000;
                      return (
                        <circle
                          key={cx}
                          cx={cx}
                          cy={cy}
                          r={isMobile ? 3 : 4}
                          fill={isCritical ? "oklch(0.6 0.2 15)" : "oklch(0.65 0.15 250)"}
                          stroke={isCritical ? "oklch(0.6 0.2 15)" : "none"}
                          strokeWidth={isCritical ? 2 : 0}
                        />
                      );
                    }}
                    activeDot={{ r: isMobile ? 5 : 6 }}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {lowestCash && (
              <p className="text-xs text-muted-foreground mt-2">
                Mínimo histórico:{" "}
                <span className="text-red-400 font-mono font-medium">
                  {formatCurrency(lowestCash.saldoCaja!)}
                </span>{" "}
                en {lowestCash.fullLabel}
                {lowestCash.hasExtras && (
                  <span className="text-amber-400"> — {lowestCash.extrasDesc}</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Chart: cumulative theoretical balance */}
        <div>
          <h3 className="text-sm font-medium mb-3">
            Balance teórico acumulado
            <span className="text-xs font-normal text-muted-foreground ml-2">
              Exp. A cobradas − egresos
            </span>
          </h3>
          <div className="h-[180px] min-w-0 sm:h-[220px]">
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
                  formatter={(value) => [formatCurrency(Number(value)), "Balance teórico"]}
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
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{row.fullLabel}</p>
                  {row.saldoCaja !== null && (
                    <span
                      className={`text-[10px] font-mono ${
                        row.saldoCaja < 200000
                          ? "text-red-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      Caja: {formatCurrency(row.saldoCaja)}
                    </span>
                  )}
                </div>
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
                {row.hasExtras && (
                  <p className="mt-1 text-[10px] text-amber-400">
                    {row.extrasDesc}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block rounded-lg border border-border overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-[minmax(100px,1.2fr)_repeat(5,minmax(90px,1fr))] gap-3 p-3 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>Mes</span>
                <span className="text-right">Cobrado</span>
                <span className="text-right">Gastado</span>
                <span className="text-right">Saldo</span>
                <span className="text-right">Acumulado</span>
                <span className="text-right">Caja real</span>
              </div>
              {balanceData.map((row) => (
                <div
                  key={row.fullLabel}
                  className={`grid grid-cols-[minmax(100px,1.2fr)_repeat(5,minmax(90px,1fr))] gap-3 p-3 border-t border-border text-sm ${
                    row.saldo < 0 ? "bg-destructive/5" : ""
                  }`}
                >
                  <span className="text-xs">
                    {row.fullLabel}
                    {row.hasExtras && (
                      <span className="text-amber-400 ml-1" title={row.extrasDesc}>*</span>
                    )}
                  </span>
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
                  <span
                    className={`text-right font-mono text-xs ${
                      row.saldoCaja !== null && row.saldoCaja < 200000
                        ? "text-red-400 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {row.saldoCaja !== null ? formatCurrency(row.saldoCaja) : "—"}
                  </span>
                </div>
              ))}
              {/* Total row */}
              <div className="grid grid-cols-[minmax(100px,1.2fr)_repeat(5,minmax(90px,1fr))] gap-3 p-3 border-t border-border bg-muted/30 font-medium">
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
                <span />
              </div>
            </div>
          </div>
          {balanceData.some((b) => b.hasExtras) && (
            <p className="text-[10px] text-amber-400 mt-2">
              * Meses con movimientos extraordinarios (préstamos de la administración)
            </p>
          )}
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
            {lowestCash && (
              <li>
                Saldo mínimo en caja:{" "}
                <span className="text-red-400 font-mono">
                  {formatCurrency(lowestCash.saldoCaja!)}
                </span>{" "}
                en {lowestCash.fullLabel}
                {lowestCash.saldoCaja! < 10000 && (
                  <span className="text-red-400"> — la administración tuvo que prestar plata</span>
                )}
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
