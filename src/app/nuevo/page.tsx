"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBuildingAction } from "@/app/upload/actions";

export default function NuevoBuildingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [adminCompany, setAdminCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await createBuildingAction({
        name: name.trim(),
        address: address.trim(),
        adminCompany: adminCompany.trim() || undefined,
      });

      if ("error" in result) {
        setError(result.error);
      } else {
        router.push(`/edificio/${result.slug}/upload`);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al crear el edificio"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="mb-6">
        <a
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Volver
        </a>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2">
        Agregar edificio
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Ingresa los datos del consorcio. Despues vas a poder subir las
        liquidaciones.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium mb-1.5"
          >
            Nombre del edificio <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Garibaldi 407/411"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium mb-1.5"
          >
            Direccion <span className="text-red-400">*</span>
          </label>
          <input
            id="address"
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Garibaldi 407, San Isidro, Buenos Aires"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <div>
          <label
            htmlFor="adminCompany"
            className="block text-sm font-medium mb-1.5"
          >
            Administracion{" "}
            <span className="text-xs text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="adminCompany"
            type="text"
            value={adminCompany}
            onChange={(e) => setAdminCompany(e.target.value)}
            placeholder="Andrade Inmobiliaria"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !name.trim() || !address.trim()}
          className="w-full rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Creando..." : "Crear edificio"}
        </button>
      </form>
    </div>
  );
}
