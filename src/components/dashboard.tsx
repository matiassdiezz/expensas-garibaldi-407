"use client";

import { useState } from "react";
import { expensasData } from "@/lib/data";
import { units } from "@/lib/units";
import { ExpenseCategory } from "@/types/expense";
import { SummaryCards } from "@/components/summary-cards";
import { MonthlyChart } from "@/components/monthly-chart";
import { CategoryChart } from "@/components/category-chart";
import { CategorySummary } from "@/components/category-summary";
import { ExpenseTable } from "@/components/expense-table";
import { MonthComparison } from "@/components/month-comparison";
import { UnitSelector } from "@/components/unit-selector";
import { AdminNotices } from "@/components/admin-notices";
import { Benchmark } from "@/components/benchmark";
import { Separator } from "@/components/ui/separator";

export function Dashboard() {
  const data = expensasData;
  const [selectedUf, setSelectedUf] = useState(26); // Default: DIEZ
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | null>(null);

  const selectedUnit = units.find((u) => u.uf === selectedUf)!;
  const firstMonth = data[0]?.label ?? "";
  const lastMonth = data[data.length - 1]?.label ?? "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
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

      {/* Unit selector */}
      <div className="mb-6">
        <UnitSelector selectedUf={selectedUf} onSelect={setSelectedUf} />
      </div>

      {/* Summary */}
      <SummaryCards data={data} unitPercent={selectedUnit.percent} />

      <Separator className="my-8" />

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyChart data={data} unitPercent={selectedUnit.percent} />
        <div className="space-y-6">
          <CategoryChart data={data} />
          <MonthComparison data={data} />
        </div>
      </div>

      <Separator className="my-8" />

      {/* Category summary + Detail table */}
      <div className="space-y-6">
        <CategorySummary
          data={data}
          selectedCategory={categoryFilter}
          onSelectCategory={setCategoryFilter}
        />
        <ExpenseTable data={data} categoryFilter={categoryFilter} />
      </div>

      <Separator className="my-8" />

      {/* Benchmark comparison */}
      <Benchmark />

      <Separator className="my-8" />

      {/* Admin notices */}
      <AdminNotices />

      {/* Footer */}
      <div className="mt-12 pb-8 text-center text-xs text-muted-foreground">
        Datos extraídos de las liquidaciones oficiales de Andrade Inmobiliaria.
        <br />
        Garibaldi 407/411, San Isidro · CUIT 30-71434946-1
      </div>
    </div>
  );
}
