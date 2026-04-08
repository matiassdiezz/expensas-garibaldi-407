import Link from "next/link";
import {
  getBuildings,
  getBuildingSummaries,
  isDbConfigured,
} from "@/lib/db";
import type { Building } from "@/types/expense";
import type { BuildingSummary } from "@/lib/db";
import { BuildingMap } from "@/components/building-map";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function Home() {
  let buildings: Building[] = [];
  let summaries: Record<string, BuildingSummary> = {};
  const dbReady = isDbConfigured();

  if (dbReady) {
    try {
      [buildings, summaries] = await Promise.all([
        getBuildings(),
        getBuildingSummaries(),
      ]);
    } catch {
      // DB may not have tables yet
    }
  }

  return (
    <main className="min-h-[100dvh] flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-[960px] px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-base font-semibold tracking-tight">
            Expensas Claras
          </span>
          <Link
            href="/nuevo"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            + Agregar edificio
          </Link>
        </div>
      </nav>

      <div className="flex-1">
        <div className="mx-auto max-w-[960px] px-4 sm:px-6">
          {/* Hero — compact */}
          <section className="pt-16 pb-10 sm:pt-20 sm:pb-12">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Mirá a dónde va tu plata.
            </h1>
            <p className="mt-3 text-base text-muted-foreground max-w-[45ch]">
              Subí la liquidación de tu edificio y visualizá gastos, tendencias
              y variaciones mes a mes.
            </p>
            {buildings.length === 0 && dbReady && (
              <Link
                href="/nuevo"
                className="inline-flex items-center mt-6 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-[#34d399] transition-colors active:scale-[0.97]"
              >
                Agregar mi edificio
              </Link>
            )}
          </section>

          {/* Map */}
          {buildings.length > 0 && (
            <section className="pb-10">
              <BuildingMap buildings={buildings} />
            </section>
          )}

          {/* Building cards */}
          {buildings.length > 0 && (
            <section className="pb-16">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
                Edificios
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {buildings.map((b) => {
                  const s = summaries[b.id];
                  const variation =
                    s?.prevTotal != null && s.prevTotal > 0
                      ? ((s.lastTotal - s.prevTotal) / s.prevTotal) * 100
                      : null;

                  return (
                    <Link
                      key={b.id}
                      href={`/edificio/${b.slug}`}
                      className="group relative rounded-xl border border-border bg-card p-5 hover:border-[rgba(255,255,255,0.15)] hover:bg-[#1a1b1c] transition-all active:scale-[0.98]"
                    >
                      {/* Accent bar */}
                      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-primary opacity-60 group-hover:opacity-100 transition-opacity" />

                      <div className="pl-3">
                        <p className="font-semibold text-foreground">
                          {b.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {b.address}
                        </p>

                        {s && (
                          <div className="flex items-center gap-3 mt-3">
                            <span className="text-sm font-mono font-medium text-foreground">
                              {formatCurrency(s.lastTotal)}
                            </span>
                            {variation !== null && (
                              <span
                                className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                                  variation > 30
                                    ? "bg-[rgba(239,68,68,0.12)] text-[#ef4444]"
                                    : variation > 10
                                      ? "bg-[rgba(245,158,11,0.12)] text-[#f59e0b]"
                                      : "bg-[rgba(16,185,129,0.12)] text-[#34d399]"
                                }`}
                              >
                                {formatPercent(variation)}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {s.lastLabel}
                            </span>
                          </div>
                        )}

                        {s && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {s.monthCount}{" "}
                            {s.monthCount === 1 ? "liquidación" : "liquidaciones"}
                            {b.adminCompany && (
                              <> · {b.adminCompany}</>
                            )}
                          </p>
                        )}

                        {!s && b.adminCompany && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {b.adminCompany}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/nuevo"
                  className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-[rgba(255,255,255,0.15)] transition-all active:scale-[0.97]"
                >
                  + Agregar otro edificio
                </Link>
              </div>
            </section>
          )}

          {/* Empty state */}
          {dbReady && buildings.length === 0 && (
            <section className="text-center py-16">
              <p className="text-sm text-muted-foreground">
                Todavía no hay edificios cargados.
              </p>
            </section>
          )}

          {/* DB not configured hint */}
          {!dbReady && (
            <p className="mt-12 text-center text-xs text-muted-foreground">
              Configurá DATABASE_URL para habilitar la persistencia.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-[960px] px-4 sm:px-6 py-6 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Expensas Claras
          </span>
          <span className="text-xs text-muted-foreground">
            Hecho con datos públicos de liquidaciones
          </span>
        </div>
      </footer>
    </main>
  );
}
