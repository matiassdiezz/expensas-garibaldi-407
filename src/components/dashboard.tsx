"use client";

import type { LiquidacionFull } from "@/types/expense";
import { SummaryCards } from "@/components/summary-cards";
import { MonthlyChart } from "@/components/monthly-chart";
import { CategoryChart } from "@/components/category-chart";
import { ExpenseTable } from "@/components/expense-table";
import { Forecast } from "@/components/forecast";
import { BalanceTracker } from "@/components/balance-tracker";
import { AdminNotices } from "@/components/admin-notices";
import { Benchmark } from "@/components/benchmark";
import { Separator } from "@/components/ui/separator";
import { MobileSectionNav } from "@/components/mobile-section-nav";

interface DashboardProps {
  data: LiquidacionFull[];
}

export function Dashboard({ data }: DashboardProps) {
  const firstMonth = data[0]?.label ?? "";
  const lastMonth = data[data.length - 1]?.label ?? "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
              Expensas Garibaldi 407/411
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Consorcio de Propietarios · San Isidro · Administración Andrade
            </p>
            <p className="text-sm text-muted-foreground">
              {firstMonth} – {lastMonth} · {data.length} liquidaciones
            </p>
          </div>
          <MobileSectionNav className="md:hidden" />
        </div>
      </div>

      {/* Summary */}
      <section id="section-resumen" className="scroll-mt-6">
        <SummaryCards data={data} />
      </section>

      <Separator className="my-8" />

      {/* Evolution chart: egresos vs expensas vs caja */}
      <MonthlyChart data={data} />

      <Separator className="my-8" />

      {/* Balance tracker */}
      <section id="section-balance" className="scroll-mt-6">
        <BalanceTracker data={data} />
      </section>

      <Separator className="my-8" />

      {/* Detail table */}
      <section id="section-detalle" className="scroll-mt-6">
        <ExpenseTable data={data} />
      </section>

      <Separator className="my-8" />

      {/* Category pie chart */}
      <CategoryChart data={data} />

      <Separator className="my-8" />

      {/* Forecast */}
      <section id="section-proyeccion" className="scroll-mt-6">
        <Forecast data={data} unitPercent={6.4} />
      </section>

      <Separator className="my-8" />

      {/* Benchmark comparison */}
      <section id="section-benchmark" className="scroll-mt-6">
        <Benchmark data={data} />
      </section>

      <Separator className="my-8" />

      {/* Admin notices */}
      <section id="section-comunicados" className="scroll-mt-6">
        <AdminNotices data={data} />
      </section>

      {/* Footer */}
      <div className="mt-12 pb-8 text-center text-xs text-muted-foreground">
        Datos extraídos de las liquidaciones oficiales de Andrade Inmobiliaria.
        <br />
        Garibaldi 407/411, San Isidro · CUIT 30-71434946-1
      </div>
    </div>
  );
}
