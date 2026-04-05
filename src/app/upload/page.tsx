"use client";

import { useState, useCallback, type DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_LABELS, type LiquidacionFull } from "@/types/expense";
import { parsePdfAction, saveLiquidacionAction } from "./actions";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsed, setParsed] = useState<LiquidacionFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== "application/pdf") {
      setError("Solo se aceptan archivos PDF");
      return;
    }
    setFile(f);
    setError(null);
    setParsed(null);
    setSuccess(false);
    setParsing(true);

    try {
      const base64 = await fileToBase64(f);
      const result = await parsePdfAction(base64);
      if ("error" in result) {
        setError(result.error);
      } else {
        setParsed(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar el PDF");
    } finally {
      setParsing(false);
    }
  }, []);

  const handleSave = async () => {
    if (!parsed) return;
    setSaving(true);
    setError(null);
    try {
      const result = await saveLiquidacionAction(parsed);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsed(null);
    setError(null);
    setSuccess(false);
  };

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver al dashboard
        </a>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2">
        Cargar liquidación
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Subí el PDF de la liquidación mensual. Claude lo parsea automáticamente y
        extrae todos los datos.
      </p>

      {/* Drop zone */}
      {!parsed && !success && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            dragOver
              ? "border-foreground/50 bg-foreground/5"
              : "border-border hover:border-foreground/30"
          }`}
        >
          {parsing ? (
            <div className="space-y-3">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
              <p className="text-sm text-muted-foreground">
                Parseando <span className="font-medium text-foreground">{file?.name}</span> con Claude...
              </p>
              <p className="text-xs text-muted-foreground">
                Esto toma ~10 segundos
              </p>
            </div>
          ) : (
            <label className="cursor-pointer space-y-3 block">
              <div className="text-4xl">📄</div>
              <p className="text-sm font-medium">
                Arrastrá el PDF acá o hacé click para seleccionar
              </p>
              <p className="text-xs text-muted-foreground">
                Liquidación mensual de Andrade Inmobiliaria (.pdf)
              </p>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={handleReset}
            className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mt-4 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-6 text-center space-y-3">
          <p className="text-lg font-medium text-emerald-400">
            Liquidación guardada
          </p>
          <p className="text-sm text-muted-foreground">
            {parsed?.label} — {formatCurrency(parsed?.total ?? 0)}
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <a
              href="/"
              className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90"
            >
              Ver dashboard
            </a>
            <button
              onClick={handleReset}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Cargar otra
            </button>
          </div>
        </div>
      )}

      {/* Parsed preview */}
      {parsed && !success && (
        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {parsed.label}
                </CardTitle>
                <Badge variant="outline">{parsed.month}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {parsed.items.length} items · Parseado de {file?.name}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Total egresos</p>
                  <p className="text-lg font-bold font-mono">
                    {formatCurrency(parsed.total)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Expensas A</p>
                  <p className="text-lg font-bold font-mono">
                    {formatCurrency(parsed.expensasA)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">UF 26 (Diez)</p>
                  <p className="text-lg font-bold font-mono">
                    {formatCurrency(parsed.ufDiez)}
                  </p>
                </div>
              </div>

              {/* Cash flow */}
              {parsed.cashFlow && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Movimientos de caja
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Saldo ant.</span>
                        <p className="font-mono">{formatCurrency(parsed.cashFlow.saldoAnterior)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ingresos</span>
                        <p className="font-mono text-emerald-400">{formatCurrency(parsed.cashFlow.ingresos)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Egresos</span>
                        <p className="font-mono text-red-400">{formatCurrency(parsed.cashFlow.egresos)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Saldo final</span>
                        <p className="font-mono font-medium">{formatCurrency(parsed.cashFlow.saldoFinal)}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Items table */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Items extraídos
                </p>
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {parsed.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs py-1.5 border-b border-border last:border-0"
                    >
                      <Badge variant="outline" className="text-[10px] shrink-0 w-[120px] justify-center">
                        {CATEGORY_LABELS[item.category]?.split(" · ")[0] ?? item.category}
                      </Badge>
                      <span className="flex-1 truncate text-muted-foreground">
                        {item.description}
                      </span>
                      <span className="font-mono tabular-nums shrink-0">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aviso */}
              {parsed.aviso && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Comunicado
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      &ldquo;{parsed.aviso}&rdquo;
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleReset}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Descartar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-foreground text-background px-6 py-2 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Confirmar y guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
