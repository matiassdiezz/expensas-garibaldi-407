"use client";

import { useState, useCallback, type DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  STANDARD_CATEGORIES,
  type LiquidacionFull,
  type ExpenseItem,
  type Building,
  type ExpenseCategory,
} from "@/types/expense";
import { saveLiquidacionAction } from "@/app/upload/actions";

interface BuildingUploadProps {
  building: Building;
}

export function BuildingUpload({ building }: BuildingUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsed, setParsed] = useState<LiquidacionFull | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [showRawText, setShowRawText] = useState(false);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low">("high");
  const [warnings, setWarnings] = useState<string[]>([]);
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
    setRawText("");
    setSuccess(false);
    setParsing(true);

    try {
      const { parsePdfClientSide } = await import("@/lib/parser");
      const result = await parsePdfClientSide(f);

      setRawText(result.rawText);
      setConfidence(result.confidence);
      setWarnings(result.warnings);

      // Build a LiquidacionFull from the partial result
      const data = result.data;
      setParsed({
        month: data.month ?? "",
        label: data.label ?? "",
        total: data.total ?? 0,
        expensasA: data.expensasA ?? 0,
        items: data.items ?? [],
        periodo: data.periodo,
        vencimiento: data.vencimiento,
        cashFlow: data.cashFlow,
        prorrateo: data.prorrateo,
        egresosPorSeccion: data.egresosPorSeccion,
        aviso: data.aviso,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar el PDF");
    } finally {
      setParsing(false);
    }
  }, []);

  const handleSave = async () => {
    if (!parsed) return;
    if (!parsed.month) {
      setError("Completá el mes antes de guardar (formato: YYYY-MM)");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Recalculate total and egresosPorSeccion from items
      const total = parsed.items.reduce((s, i) => s + i.amount, 0);
      const egresosPorSeccion: Record<string, number> = {};
      for (const item of parsed.items) {
        egresosPorSeccion[item.category] =
          (egresosPorSeccion[item.category] ?? 0) + item.amount;
      }

      const dataToSave: LiquidacionFull = {
        ...parsed,
        total: Math.round(total * 100) / 100,
        egresosPorSeccion,
      };

      const result = await saveLiquidacionAction(building.id, dataToSave);
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
    setRawText("");
    setWarnings([]);
    setError(null);
    setSuccess(false);
  };

  // --- Editing helpers ---
  const updateItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    if (!parsed) return;
    const newItems = [...parsed.items];
    newItems[index] = { ...newItems[index], [field]: value };
    const total = newItems.reduce((s, i) => s + i.amount, 0);
    setParsed({ ...parsed, items: newItems, total: Math.round(total * 100) / 100 });
  };

  const removeItem = (index: number) => {
    if (!parsed) return;
    const newItems = parsed.items.filter((_, i) => i !== index);
    const total = newItems.reduce((s, i) => s + i.amount, 0);
    setParsed({ ...parsed, items: newItems, total: Math.round(total * 100) / 100 });
  };

  const addItem = () => {
    if (!parsed) return;
    setParsed({
      ...parsed,
      items: [
        ...parsed.items,
        { category: "otros" as ExpenseCategory, description: "", amount: 0 },
      ],
    });
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

  const computedTotal = parsed
    ? parsed.items.reduce((s, i) => s + i.amount, 0)
    : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <a
          href={`/edificio/${building.slug}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Volver al dashboard
        </a>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-1">
        Cargar liquidación
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        {building.name} &middot; Subí el PDF y se parsea automáticamente en tu
        navegador.
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
              ? "border-primary/50 bg-primary/5"
              : "border-border hover:border-[rgba(255,255,255,0.15)]"
          }`}
        >
          {parsing ? (
            <div className="space-y-3">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <p className="text-sm text-muted-foreground">
                Extrayendo texto de{" "}
                <span className="font-medium text-foreground">
                  {file?.name}
                </span>
              </p>
            </div>
          ) : (
            <label className="cursor-pointer space-y-3 block">
              <div className="text-4xl">📄</div>
              <p className="text-sm font-medium">
                Arrastrá el PDF acá o hacé click para seleccionar
              </p>
              <p className="text-xs text-muted-foreground">
                Liquidación mensual (.pdf)
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
            onClick={() => setError(null)}
            className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mt-4 rounded-lg border border-primary/50 bg-primary/10 p-6 text-center space-y-3">
          <p className="text-lg font-medium text-primary">
            Liquidación guardada
          </p>
          <p className="text-sm text-muted-foreground">
            {parsed?.label} — {formatCurrency(parsed?.total ?? 0)}
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <a
              href={`/edificio/${building.slug}`}
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-[#34d399] active:scale-[0.97] transition-all"
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

      {/* Editable preview */}
      {parsed && !success && (
        <div className="mt-6 space-y-4">
          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="rounded-lg border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.08)] p-3 space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-[#f59e0b]">
                  {w}
                </p>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    value={parsed.label}
                    onChange={(e) =>
                      setParsed({ ...parsed, label: e.target.value })
                    }
                    placeholder="Marzo 2026"
                    className="bg-transparent text-base font-semibold border-b border-transparent hover:border-border focus:border-primary focus:outline-none w-full"
                  />
                  <input
                    value={parsed.month}
                    onChange={(e) =>
                      setParsed({ ...parsed, month: e.target.value })
                    }
                    placeholder="2026-03"
                    className="bg-transparent text-xs font-mono border rounded px-2 py-1 w-[90px] text-center border-border focus:border-primary focus:outline-none"
                  />
                </div>
                <Badge
                  variant={
                    confidence === "high"
                      ? "default"
                      : confidence === "medium"
                        ? "secondary"
                        : "destructive"
                  }
                  className="shrink-0 text-[10px]"
                >
                  {confidence === "high"
                    ? "Confianza alta"
                    : confidence === "medium"
                      ? "Revisar"
                      : "Manual"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {parsed.items.length} items &middot; {file?.name}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Total egresos</p>
                  <p className="text-lg font-bold font-mono">
                    {formatCurrency(Math.round(computedTotal * 100) / 100)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Expensas A</p>
                  <input
                    type="number"
                    value={parsed.expensasA}
                    onChange={(e) =>
                      setParsed({
                        ...parsed,
                        expensasA: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-transparent text-lg font-bold font-mono w-full focus:outline-none"
                  />
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
                      {(
                        [
                          ["Saldo ant.", "saldoAnterior", ""],
                          ["Ingresos", "ingresos", "text-primary"],
                          ["Egresos", "egresos", "text-destructive"],
                          ["Saldo final", "saldoFinal", "font-medium"],
                        ] as const
                      ).map(([label, key, cls]) => (
                        <div key={key}>
                          <span className="text-muted-foreground">{label}</span>
                          <p className={`font-mono ${cls}`}>
                            {formatCurrency(
                              parsed.cashFlow![
                                key as keyof typeof parsed.cashFlow
                              ] as number
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Editable items table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Items
                  </p>
                  <button
                    onClick={addItem}
                    className="text-xs text-primary hover:text-[#34d399] transition-colors"
                  >
                    + Agregar item
                  </button>
                </div>
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {parsed.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs py-1.5 border-b border-border last:border-0"
                    >
                      <Select
                        value={item.category}
                        onValueChange={(v) => v && updateItem(i, "category", v)}
                      >
                        <SelectTrigger className="w-[130px] h-7 text-[10px] shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STANDARD_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-xs">
                              {CATEGORY_LABELS[cat]?.replace(/^[A-I] · /, "") ??
                                cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(i, "description", e.target.value)
                        }
                        className="flex-1 min-w-0 bg-transparent text-muted-foreground truncate border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                      />
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          updateItem(
                            i,
                            "amount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-[100px] text-right font-mono tabular-nums bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                      />
                      <button
                        onClick={() => removeItem(i)}
                        className="text-muted-foreground hover:text-destructive shrink-0 px-1"
                        title="Eliminar"
                      >
                        &times;
                      </button>
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

              {/* Raw text toggle */}
              {rawText && (
                <>
                  <Separator />
                  <div>
                    <button
                      onClick={() => setShowRawText(!showRawText)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showRawText
                        ? "Ocultar texto extraído"
                        : "Ver texto extraído del PDF"}
                    </button>
                    {showRawText && (
                      <pre className="mt-2 text-[10px] font-mono text-muted-foreground bg-background rounded-lg p-3 max-h-[300px] overflow-auto border border-border whitespace-pre-wrap">
                        {rawText}
                      </pre>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleReset}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !parsed.month}
              className="rounded-lg bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-[#34d399] disabled:opacity-50 active:scale-[0.97] transition-all"
            >
              {saving ? "Guardando..." : "Confirmar y guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
