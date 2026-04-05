"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
} from "recharts";

interface BalanceTrackerProps {
  data: LiquidacionFull[];
}

export function BalanceTracker({ data }: BalanceTrackerProps) {
  const isMobile = useMobile();
  const [detailOpen, setDetailOpen] = useState(false);

  // Calculate monthly and cumulative balance using REAL income (cashFlow.ingresos)
  let cumulative = 0;
  const balanceData = data.map((m) => {
    const cobrado = m.cashFlow?.ingresos ?? m.expensasA;
    const facturado = m.prorrateo?.totalAPagar ?? m.expensasA;
    const gastado = m.total;
    const saldo = cobrado - gastado;
    cumulative += saldo;

    const saldoCaja = m.cashFlow?.saldoFinal ?? null;
    const extras = m.cashFlow?.extras ?? [];
    const morosidadMes =
      facturado > 0 ? ((facturado - cobrado) / facturado) * 100 : 0;

    return {
      name: `${m.label.split(" ")[0].slice(0, 3)} ${m.label.split(" ")[1]?.slice(2) ?? ""}`,
      fullLabel: m.label,
      facturado,
      cobrado,
      gastado,
      saldo,
      acumulado: cumulative,
      saldoCaja,
      morosidadMes,
      hasExtras: extras.length > 0,
      extrasDesc: extras.map((e) => e.descripcion).join("; "),
    };
  });

  const totalCobrado = data.reduce(
    (s, m) => s + (m.cashFlow?.ingresos ?? m.expensasA),
    0
  );
  const totalGastado = data.reduce((s, m) => s + m.total, 0);
  const balanceFinal = totalCobrado - totalGastado;
  const isPositive = balanceFinal >= 0;
  const totalFacturado = data.reduce(
    (s, m) => s + (m.prorrateo?.totalAPagar ?? m.expensasA),
    0
  );
  const morosidadTotal =
    totalFacturado > 0
      ? ((totalFacturado - totalCobrado) / totalFacturado) * 100
      : 0;

  // Real cash balance
  const withCash = balanceData.filter((b) => b.saldoCaja !== null);
  const lastWithCash = [...balanceData]
    .reverse()
    .find((b) => b.saldoCaja !== null);
  const saldoCajaActual = lastWithCash?.saldoCaja ?? null;

  const lowestCash =
    withCash.length > 0
      ? withCash.reduce((min, b) =>
          b.saldoCaja! < min.saldoCaja! ? b : min
        )
      : null;

  // Deficit/surplus months
  const deficitMonths = balanceData.filter((b) => b.saldo < 0);
  const surplusMonths = balanceData.filter((b) => b.saldo > 0);

  const biggestSurplus =
    surplusMonths.length > 0
      ? surplusMonths.reduce((max, b) => (b.saldo > max.saldo ? b : max))
      : null;
  const biggestDeficit =
    deficitMonths.length > 0
      ? deficitMonths.reduce((min, b) => (b.saldo < min.saldo ? b : min))
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          ¿Se cobra lo que se gasta?
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Lo que entra vs lo que sale · {data.length} meses
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 3 headline cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Cobrado</p>
            <p className="text-base sm:text-lg font-bold font-mono mt-0.5">
              {formatCurrency(totalCobrado)}
            </p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Gastado</p>
            <p className="text-base sm:text-lg font-bold font-mono mt-0.5">
              {formatCurrency(totalGastado)}
            </p>
          </div>
          <div
            className={`rounded-lg border p-3 ${
              isPositive
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-destructive/50 bg-destructive/5"
            }`}
          >
            <p className="text-xs text-muted-foreground">
              {isPositive ? "Sobró" : "Faltó"}
            </p>
            <p className="text-base sm:text-lg font-bold font-mono mt-0.5">
              {formatCurrency(Math.abs(balanceFinal))}
            </p>
          </div>
        </div>

        {/* Key insight callout */}
        {saldoCajaActual !== null && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-200">
              En la cuenta del edificio hay{" "}
              {formatCurrency(saldoCajaActual)} hoy.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              De {data.length} meses, en {deficitMonths.length} se gastó
              más de lo cobrado y en {surplusMonths.length} sobró.
              {morosidadTotal > 2 && (
                <> Hay {formatCurrency(totalFacturado - totalCobrado)} sin
                cobrar ({morosidadTotal.toFixed(1)}% de morosidad).</>
              )}
            </p>
          </div>
        )}

        {/* Chart: real cash balance over time */}
        {withCash.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">
              Plata en la cuenta del edificio
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
                    <linearGradient
                      id="cashGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="oklch(0.65 0.15 250)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="oklch(0.65 0.15 250)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(1 0 0 / 10%)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="oklch(0.7 0 0)"
                    fontSize={isMobile ? 10 : 11}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    padding={{
                      left: isMobile ? 8 : 15,
                      right: isMobile ? 8 : 15,
                    }}
                  />
                  <YAxis
                    stroke="oklch(0.7 0 0)"
                    fontSize={isMobile ? 9 : 10}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    width={isMobile ? 38 : 50}
                    tickFormatter={(value) => {
                      if (value >= 1000000)
                        return `${(value / 1000000).toFixed(1)}M`;
                      return `${(value / 1000).toFixed(0)}k`;
                    }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "Saldo en cuenta",
                    ]}
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
                      if (
                        cx == null ||
                        cy == null ||
                        payload.saldoCaja === null
                      )
                        return <g key={cx} />;
                      const isCritical = payload.saldoCaja < 200000;
                      return (
                        <circle
                          key={cx}
                          cx={cx}
                          cy={cy}
                          r={isMobile ? 3 : 4}
                          fill={
                            isCritical
                              ? "oklch(0.6 0.2 15)"
                              : "oklch(0.65 0.15 250)"
                          }
                          stroke={
                            isCritical ? "oklch(0.6 0.2 15)" : "none"
                          }
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
                {lowestCash.saldoCaja! < 10000 && (
                  <span className="text-red-400">
                    {" "}
                    — la administración tuvo que prestar plata
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Collapsible detail */}
        <Collapsible open={detailOpen} onOpenChange={setDetailOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border p-2.5 hover:bg-muted/50 transition-colors cursor-pointer text-sm text-muted-foreground">
              {detailOpen ? "Ocultar detalle" : "Ver detalle mes a mes"}
              <span className="text-xs">
                {detailOpen ? "▲" : "▼"}
              </span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 space-y-6">
              {/* Cumulative theoretical balance chart */}
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Balance teórico acumulado
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    Cobrado − gastado, acumulado
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
                        <linearGradient
                          id="balanceGradientPos"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="oklch(0.7 0.18 160)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="oklch(0.7 0.18 160)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="balanceGradientNeg"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="oklch(0.6 0.2 15)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="oklch(0.6 0.2 15)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(1 0 0 / 10%)"
                      />
                      <XAxis
                        dataKey="name"
                        stroke="oklch(0.7 0 0)"
                        fontSize={isMobile ? 10 : 11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={6}
                        padding={{
                          left: isMobile ? 8 : 15,
                          right: isMobile ? 8 : 15,
                        }}
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
                          if (abs >= 1000000)
                            return `${(value / 1000000).toFixed(1)}M`;
                          return `${(value / 1000).toFixed(0)}k`;
                        }}
                      />
                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(Number(value)),
                          "Balance acumulado",
                        ]}
                        contentStyle={{
                          backgroundColor: "oklch(0.205 0 0)",
                          border: "1px solid oklch(1 0 0 / 10%)",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                        labelStyle={{ color: "oklch(0.7 0 0)" }}
                      />
                      <ReferenceLine
                        y={0}
                        stroke="oklch(0.5 0 0)"
                        strokeDasharray="3 3"
                      />
                      <Area
                        type="monotone"
                        dataKey="acumulado"
                        stroke={
                          isPositive
                            ? "oklch(0.7 0.18 160)"
                            : "oklch(0.6 0.2 15)"
                        }
                        strokeWidth={2}
                        fill={
                          isPositive
                            ? "url(#balanceGradientPos)"
                            : "url(#balanceGradientNeg)"
                        }
                        dot={{
                          fill: isPositive
                            ? "oklch(0.7 0.18 160)"
                            : "oklch(0.6 0.2 15)",
                          r: isMobile ? 3 : 4,
                        }}
                        activeDot={{ r: isMobile ? 5 : 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Month-by-month table */}
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Detalle mes a mes
                </h3>

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
                        <p className="text-xs font-medium">
                          {row.fullLabel}
                        </p>
                        <div className="flex items-center gap-2">
                          {row.morosidadMes > 5 && (
                            <span className="text-[10px] font-mono text-red-400">
                              {row.morosidadMes.toFixed(0)}% impago
                            </span>
                          )}
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
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1">
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
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Saldo
                          </p>
                          <p className="font-mono text-xs tabular-nums">
                            {row.saldo >= 0 ? "+" : ""}
                            {formatCurrency(row.saldo)}
                          </p>
                        </div>
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
                    <div className="grid grid-cols-[minmax(100px,1.2fr)_repeat(4,minmax(80px,1fr))] gap-2 p-3 bg-muted/50 text-xs font-medium text-muted-foreground">
                      <span>Mes</span>
                      <span className="text-right">Cobrado</span>
                      <span className="text-right">Gastado</span>
                      <span className="text-right">Saldo</span>
                      <span className="text-right">Caja real</span>
                    </div>
                    {balanceData.map((row) => (
                      <div
                        key={row.fullLabel}
                        className={`grid grid-cols-[minmax(100px,1.2fr)_repeat(4,minmax(80px,1fr))] gap-2 p-3 border-t border-border text-sm ${
                          row.saldo < 0 ? "bg-destructive/5" : ""
                        }`}
                      >
                        <span className="text-xs">
                          {row.fullLabel}
                          {row.hasExtras && (
                            <span
                              className="text-amber-400 ml-1"
                              title={row.extrasDesc}
                            >
                              *
                            </span>
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
                            row.saldo < 0
                              ? "text-red-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {row.saldo >= 0 ? "+" : ""}
                          {formatCurrency(row.saldo)}
                        </span>
                        <span
                          className={`text-right font-mono text-xs ${
                            row.saldoCaja !== null && row.saldoCaja < 200000
                              ? "text-red-400 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {row.saldoCaja !== null
                            ? formatCurrency(row.saldoCaja)
                            : "—"}
                        </span>
                      </div>
                    ))}
                    {/* Total row */}
                    <div className="grid grid-cols-[minmax(100px,1.2fr)_repeat(4,minmax(80px,1fr))] gap-2 p-3 border-t border-border bg-muted/30 font-medium">
                      <span className="text-sm">Total</span>
                      <span className="text-right font-mono text-sm">
                        {formatCurrency(totalCobrado)}
                      </span>
                      <span className="text-right font-mono text-sm">
                        {formatCurrency(totalGastado)}
                      </span>
                      <span
                        className={`text-right font-mono text-sm ${
                          balanceFinal < 0
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {balanceFinal >= 0 ? "+" : ""}
                        {formatCurrency(balanceFinal)}
                      </span>
                      <span />
                    </div>
                  </div>
                </div>
                {balanceData.some((b) => b.hasExtras) && (
                  <p className="text-[10px] text-amber-400 mt-2">
                    * Meses con movimientos extraordinarios (préstamos de
                    la administración)
                  </p>
                )}
              </div>

              {/* Key insights */}
              <div className="border-t border-border pt-4 space-y-2">
                <h3 className="text-sm font-medium">Datos clave</h3>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  {biggestSurplus && (
                    <li>
                      Mejor mes:{" "}
                      <span className="text-emerald-400 font-mono">
                        +{formatCurrency(biggestSurplus.saldo)}
                      </span>{" "}
                      en {biggestSurplus.fullLabel}
                    </li>
                  )}
                  {biggestDeficit && (
                    <li>
                      Peor mes:{" "}
                      <span className="text-red-400 font-mono">
                        {formatCurrency(biggestDeficit.saldo)}
                      </span>{" "}
                      en {biggestDeficit.fullLabel}
                    </li>
                  )}
                  {lowestCash && (
                    <li>
                      Menor saldo en cuenta:{" "}
                      <span className="text-red-400 font-mono">
                        {formatCurrency(lowestCash.saldoCaja!)}
                      </span>{" "}
                      en {lowestCash.fullLabel}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
