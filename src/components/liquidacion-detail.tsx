"use client";

import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import liquidacionesRaw from "@/lib/liquidaciones.json";

const liquidaciones = liquidacionesRaw.liquidaciones;

const SECCION_LABELS: Record<string, string> = {
  A_sueldos: "A) Sueldos y Jornales",
  B_cargas_sociales: "B) Cargas Sociales",
  C_servicios_publicos: "C) Servicios Públicos",
  D_abonos_servicios: "D) Abonos y Servicios",
  E_mantenimiento: "E) Mantenimiento",
  F_reparaciones: "F) Reparaciones",
  G_gastos_bancarios: "G) Gastos Bancarios",
  H_seguros_gastos: "H) Seguros y Gastos Varios",
  I_administracion: "I) Honorarios Administración",
};

interface LiquidacionDetailProps {
  month: string;
}

export function LiquidacionDetail({ month }: LiquidacionDetailProps) {
  const liq = liquidaciones.find((l) => l.liquidacion === month);
  if (!liq) return null;

  const { cashFlow, prorrateo, egresos, aviso } = liq;
  const secciones = egresos.secciones as Record<string, number>;

  return (
    <div className="bg-muted/30 border-t border-border px-3 py-4 sm:px-5 space-y-4">
      <div className="flex items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Liquidación oficial
        </h4>
        <Badge variant="outline" className="text-[10px]">
          Vto: {new Date(liq.vencimiento).toLocaleDateString("es-AR")}
        </Badge>
      </div>

      {/* Resumen de Movimientos de Caja */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2">
          Resumen de Movimientos de Caja
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
          <div className="flex justify-between sm:flex-col sm:gap-0.5">
            <span className="text-muted-foreground">Saldo anterior</span>
            <span className="font-mono tabular-nums">
              {formatCurrency(cashFlow.saldoAnterior)}
            </span>
          </div>
          <div className="flex justify-between sm:flex-col sm:gap-0.5">
            <span className="text-muted-foreground">Ingresos</span>
            <span className="font-mono tabular-nums text-emerald-400">
              {formatCurrency(cashFlow.ingresos)}
            </span>
          </div>
          <div className="flex justify-between sm:flex-col sm:gap-0.5">
            <span className="text-muted-foreground">Egresos</span>
            <span className="font-mono tabular-nums text-red-400">
              {formatCurrency(cashFlow.egresos)}
            </span>
          </div>
          <div className="flex justify-between sm:flex-col sm:gap-0.5">
            <span className="text-muted-foreground font-medium">Saldo final</span>
            <span
              className={`font-mono tabular-nums font-medium ${
                cashFlow.saldoFinal < 200000 ? "text-red-400" : ""
              }`}
            >
              {formatCurrency(cashFlow.saldoFinal)}
            </span>
          </div>
        </div>
        {cashFlow.extras.length > 0 && (
          <div className="mt-2 space-y-1">
            {(cashFlow.extras as Array<{ tipo: string; monto: number; descripcion: string }>).map(
              (extra, i) => (
                <p key={i} className="text-[11px] text-amber-400">
                  ⚠ {extra.descripcion} ({formatCurrency(extra.monto)})
                </p>
              )
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Prorrateo */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2">
          Prorrateo de Expensas
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
          <div className="flex justify-between sm:flex-col sm:gap-0.5">
            <span className="text-muted-foreground">Expensas A</span>
            <span className="font-mono tabular-nums">{formatCurrency(prorrateo.expensasA)}</span>
          </div>
          {prorrateo.expensasB > 0 && (
            <div className="flex justify-between sm:flex-col sm:gap-0.5">
              <span className="text-muted-foreground">Expensas B</span>
              <span className="font-mono tabular-nums">{formatCurrency(prorrateo.expensasB)}</span>
            </div>
          )}
          <div className="flex justify-between sm:flex-col sm:gap-0.5">
            <span className="text-muted-foreground font-medium">Total a pagar</span>
            <span className="font-mono tabular-nums font-medium">
              {formatCurrency(prorrateo.totalAPagar)}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Egresos por sección */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2">
          Egresos por Sección — Total: {formatCurrency(egresos.total)}
        </p>
        <div className="space-y-1">
          {Object.entries(secciones).map(([key, value]) => {
            if (value === 0) return null;
            const pct = ((value / egresos.total) * 100).toFixed(1);
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="w-[200px] sm:w-[240px] truncate text-muted-foreground">
                  {SECCION_LABELS[key] ?? key}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
                  <div
                    className="h-full bg-foreground/30 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-mono tabular-nums text-right w-[90px]">
                  {formatCurrency(value)}
                </span>
                <span className="text-muted-foreground text-[10px] w-[40px] text-right">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aviso */}
      {aviso && (
        <>
          <Separator />
          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-1">
              Comunicado de la Administración
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              &ldquo;{aviso}&rdquo;
            </p>
          </div>
        </>
      )}
    </div>
  );
}
