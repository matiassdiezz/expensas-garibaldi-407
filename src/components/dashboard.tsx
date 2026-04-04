"use client";

import { useState } from "react";
import { expensasData } from "@/lib/data";
import { units } from "@/lib/units";
import { SummaryCards } from "@/components/summary-cards";
import { MonthlyChart } from "@/components/monthly-chart";
import { CategoryChart } from "@/components/category-chart";
import { ExpenseTable } from "@/components/expense-table";
import { MonthComparison } from "@/components/month-comparison";
import { UnitSelector } from "@/components/unit-selector";
import { Forecast } from "@/components/forecast";
import { BalanceTracker } from "@/components/balance-tracker";
import { AdminNotices } from "@/components/admin-notices";
import { Benchmark } from "@/components/benchmark";
import { Separator } from "@/components/ui/separator";
import { MobileSectionNav } from "@/components/mobile-section-nav";

export function Dashboard() {
  const data = expensasData;
  const [selectedUf, setSelectedUf] = useState(26); // Default: DIEZ

  const selectedUnit = units.find((u) => u.uf === selectedUf)!;
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

      {/* Unit selector */}
      <div id="section-unidad" className="mb-6 scroll-mt-6">
        <UnitSelector selectedUf={selectedUf} onSelect={setSelectedUf} />
      </div>

      {/* Summary */}
      <section id="section-resumen" className="scroll-mt-6">
        <SummaryCards data={data} unitPercent={selectedUnit.percent} />
      </section>

      <Separator className="my-8" />

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyChart data={data} unitPercent={selectedUnit.percent} />
        <div className="space-y-6">
          <section id="section-categorias" className="scroll-mt-6">
            <CategoryChart data={data} />
          </section>
          <section id="section-comparador" className="scroll-mt-6">
            <MonthComparison data={data} />
          </section>
        </div>
      </div>

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

      {/* Forecast */}
      <section id="section-proyeccion" className="scroll-mt-6">
        <Forecast data={data} unitPercent={selectedUnit.percent} />
      </section>

      <Separator className="my-8" />

      {/* Benchmark comparison */}
      <section id="section-benchmark" className="scroll-mt-6">
        <Benchmark />
      </section>

      <Separator className="my-8" />

      {/* Admin notices */}
      <section id="section-comunicados" className="scroll-mt-6">
        <AdminNotices />
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
