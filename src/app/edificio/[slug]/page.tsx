import { notFound } from "next/navigation";
import { getBuildingBySlug, getLiquidaciones } from "@/lib/db";
import { Dashboard } from "@/components/dashboard";
import type { Metadata } from "next";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const building = await getBuildingBySlug(slug);
  if (!building) return { title: "Edificio no encontrado" };
  return {
    title: `Expensas ${building.name}`,
    description: `Analisis de expensas de ${building.name} — ${building.address}`,
  };
}

export default async function BuildingDashboardPage({ params }: PageProps) {
  const { slug } = await params;
  const building = await getBuildingBySlug(slug);
  if (!building) notFound();

  const data = await getLiquidaciones(building.id);

  if (data.length === 0) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center">
          <div className="mb-6">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Todos los edificios
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {building.name}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {building.address}
          </p>
          <div className="rounded-xl border border-dashed border-border p-12">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm font-medium mb-1">
              Todavia no hay liquidaciones
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Subi el primer PDF para empezar a ver los datos.
            </p>
            <Link
              href={`/edificio/${slug}/upload`}
              className="inline-flex items-center rounded-lg bg-foreground text-background px-6 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Cargar liquidacion
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <Dashboard data={data} building={building} />
    </main>
  );
}
