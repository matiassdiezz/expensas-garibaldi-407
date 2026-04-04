"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const MOBILE_NAV_SECTIONS = [
  { href: "#section-resumen", label: "Resumen" },
  { href: "#section-unidad", label: "Tu unidad" },
  { href: "#section-egresos-expensas", label: "Egresos vs expensas" },
  { href: "#section-tu-expensa", label: "Tu expensa" },
  { href: "#section-categorias", label: "Gasto por categoría" },
  { href: "#section-comparador", label: "Comparador" },
  { href: "#section-balance", label: "Balance cobrado vs gastado" },
  { href: "#section-detalle", label: "Detalle por mes" },
  { href: "#section-proyeccion", label: "Proyección" },
  { href: "#section-benchmark", label: "Vs. promedios nacionales" },
  { href: "#section-comunicados", label: "Comunicados" },
] as const;

const PANEL_ID = "mobile-nav-sections-panel";

interface MobileSectionNavProps {
  className?: string;
}

export function MobileSectionNav({ className }: MobileSectionNavProps) {
  const panelId = PANEL_ID;
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openRef.current) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        aria-label={open ? "Cerrar menú de secciones" : "Abrir menú de secciones"}
        onClick={() => setOpen((v) => !v)}
        className="touch-manipulation"
      >
        {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={close}
          />
          <nav
            id={panelId}
            role="navigation"
            aria-label="Secciones de la página"
            className="fixed top-0 right-0 z-50 flex h-full max-h-svh w-[min(20rem,calc(100vw-1rem))] flex-col border-l border-border bg-card shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">Secciones</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Cerrar"
                onClick={close}
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
            <ul className="flex-1 overflow-y-auto py-2">
              {MOBILE_NAV_SECTIONS.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="block px-4 py-3 text-sm text-foreground hover:bg-muted/80 active:bg-muted"
                    onClick={close}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
