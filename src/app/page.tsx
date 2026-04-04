import { expensasData } from "@/lib/data";
import { SummaryCards } from "@/components/summary-cards";
import { MonthlyChart } from "@/components/monthly-chart";
import { CategoryChart } from "@/components/category-chart";
import { ExpenseTable } from "@/components/expense-table";
import { MonthComparison } from "@/components/month-comparison";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const data = expensasData;
  const firstMonth = data[0]?.label ?? "";
  const lastMonth = data[data.length - 1]?.label ?? "";

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Expensas Garibaldi 407
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Análisis de gastos · {firstMonth} – {lastMonth} · {data.length} meses
          </p>
        </div>

        {/* Summary */}
        <SummaryCards data={data} />

        <Separator className="my-8" />

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <MonthlyChart data={data} />
          <CategoryChart data={data} />
        </div>

        <Separator className="my-8" />

        {/* Detail table */}
        <ExpenseTable data={data} />

        <Separator className="my-8" />

        {/* Comparator */}
        <MonthComparison data={data} />

        {/* Footer */}
        <div className="mt-12 pb-8 text-center text-xs text-muted-foreground">
          Datos extraídos de las liquidaciones de expensas oficiales.
          <br />
          Si encontrás errores, contactá a la administración.
        </div>
      </div>
    </main>
  );
}
