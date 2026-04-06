"use client";

import type { LiquidacionFull, Building } from "@/types/expense";
import { SummaryCards } from "@/components/summary-cards";
import { CategoryOverview } from "@/components/category-overview";
import { MonthlyChart } from "@/components/monthly-chart";
import { Benchmark } from "@/components/benchmark";
import { ExpenseTable } from "@/components/expense-table";
import { BalanceTracker } from "@/components/balance-tracker";
import { Forecast } from "@/components/forecast";
import { AdminNotices } from "@/components/admin-notices";
import { Separator } from "@/components/ui/separator";
import { MobileSectionNav } from "@/components/mobile-section-nav";
import Link from "next/link";

interface DashboardProps {
  data: LiquidacionFull[];
  building: Building;
}

export function Dashboard({ data, building }: DashboardProps) {
  const firstMonth = data[0]?.label ?? "";
  const lastMonth = data[data.length - 1]?.label ?? "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            &larr; Todos los edificios
          </Link>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
              Expensas {building.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {building.address}
              {building.adminCompany
                ? ` · Administracion ${building.adminCompany}`
                : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {firstMonth} – {lastMonth} · {data.length} liquidaciones
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/edificio/${building.slug}/upload`}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors hidden sm:inline-flex"
            >
              + Cargar liquidacion
            </Link>
            <MobileSectionNav className="md:hidden" />
          </div>
        </div>
      </div>

      {/* 1. Summary — la foto rápida */}
      <section id="section-resumen" className="scroll-mt-6">
        <SummaryCards data={data} />
      </section>

      <Separator className="my-8" />

      {/* 2. ¿En qué se gasta? — la respuesta principal */}
      <CategoryOverview data={data} />

      <Separator className="my-8" />

      {/* 3. ¿Por qué sube? — la película */}
      <MonthlyChart data={data} />

      <Separator className="my-8" />

      {/* 4. ¿Es normal? — contexto nacional */}
      <section id="section-benchmark" className="scroll-mt-6">
        <Benchmark data={data} />
      </section>

      <Separator className="my-8" />

      {/* 5. Rendición mes a mes — el detalle */}
      <section id="section-detalle" className="scroll-mt-6">
        <ExpenseTable data={data} />
      </section>

      <Separator className="my-8" />

      {/* 6. ¿Se cobra lo que se gasta? — balance */}
      <section id="section-balance" className="scroll-mt-6">
        <BalanceTracker data={data} />
      </section>

      <Separator className="my-8" />

      {/* 7. ¿Cuánto viene? — proyección */}
      <section id="section-proyeccion" className="scroll-mt-6">
        <Forecast data={data} />
      </section>

      <Separator className="my-8" />

      {/* 8. ¿Qué dijo la administración? */}
      <section id="section-comunicados" className="scroll-mt-6">
        <AdminNotices data={data} />
      </section>

      {/* Footer */}
      <div className="mt-12 pb-8 text-center text-xs text-muted-foreground">
        Datos extraidos de las liquidaciones oficiales
        {building.adminCompany ? ` de ${building.adminCompany}` : ""}.
        <br />
        {building.name}, {building.address}
        {building.cuit ? ` · CUIT ${building.cuit}` : ""}
      </div>
    </div>
  );
}
