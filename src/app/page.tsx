import Link from "next/link";
import { getBuildings, isDbConfigured } from "@/lib/db";
import type { Building } from "@/types/expense";
import { BuildingMap } from "@/components/building-map";

export default async function Home() {
  let buildings: Building[] = [];
  const dbReady = isDbConfigured();

  if (dbReady) {
    try {
      buildings = await getBuildings();
    } catch {
      // DB may not have tables yet — show empty state
    }
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Expensas Claras
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Subi la liquidacion de tu edificio y mira a donde va tu plata.
          </p>
        </div>

        {/* Map */}
        {buildings.length > 0 && (
          <div className="mb-10">
            <BuildingMap buildings={buildings} />
          </div>
        )}

        {/* Building list */}
        {buildings.length > 0 && (
          <div className="space-y-3 mb-10">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Edificios
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {buildings.map((b) => (
                <Link
                  key={b.id}
                  href={`/edificio/${b.slug}`}
                  className="group rounded-xl border border-border p-5 hover:border-foreground/30 hover:bg-muted/50 transition-colors"
                >
                  <p className="font-semibold group-hover:text-foreground">
                    {b.name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {b.address}
                  </p>
                  {b.adminCompany && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Administracion {b.adminCompany}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state when DB is ready but no buildings */}
        {dbReady && buildings.length === 0 && (
          <div className="text-center mb-10">
            <p className="text-sm text-muted-foreground">
              Todavia no hay edificios cargados.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/nuevo"
            className="inline-flex items-center rounded-lg bg-foreground text-background px-6 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Agregar mi edificio
          </Link>
        </div>

        {/* Footer hint when DB not configured */}
        {!dbReady && (
          <p className="mt-12 text-center text-xs text-muted-foreground">
            Configura DATABASE_URL para habilitar la persistencia.
          </p>
        )}
      </div>
    </main>
  );
}
