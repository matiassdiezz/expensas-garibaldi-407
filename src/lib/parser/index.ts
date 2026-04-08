/**
 * Client-side PDF parser for Argentine building expense reports.
 * No AI — uses pdfjs-dist for text extraction + regex/keywords for structure.
 */

import { extractText } from "./extract-text";
import { detectMetadata } from "./detect-sections";
import { parseExpenseItems } from "./parse-lines";
import type { LiquidacionFull, ExpenseCategory } from "@/types/expense";

export interface ParseResult {
  data: Partial<LiquidacionFull>;
  rawText: string;
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

export async function parsePdfClientSide(file: File): Promise<ParseResult> {
  const warnings: string[] = [];

  // 1. Extract text
  const arrayBuffer = await file.arrayBuffer();
  const extraction = await extractText(arrayBuffer);

  if (extraction.allLines.length === 0) {
    return {
      data: {},
      rawText: "",
      confidence: "low",
      warnings: [
        "No se pudo extraer texto del PDF. Posiblemente es una imagen escaneada.",
      ],
    };
  }

  // 2. Detect metadata
  const meta = detectMetadata(extraction.allLines);

  if (!meta.month) {
    warnings.push(
      "No se detectó el mes/período. Verificá el campo manualmente."
    );
  }

  // 3. Parse expense items
  const items = parseExpenseItems(extraction.allLines);

  if (items.length === 0) {
    warnings.push(
      "No se encontraron items de gasto. Revisá el texto extraído y agregá items manualmente."
    );
  }

  // 4. Calculate totals
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const totalRounded = Math.round(total * 100) / 100;

  // 5. Build egresos por seccion
  const egresosPorSeccion: Record<string, number> = {};
  for (const item of items) {
    egresosPorSeccion[item.category] =
      (egresosPorSeccion[item.category] ?? 0) + item.amount;
  }

  // 6. Estimate expensasA (ordinary expenses = total minus extraordinarias/fondo-reserva)
  const extraordinarias = egresosPorSeccion["extraordinarias"] ?? 0;
  const fondoReserva = egresosPorSeccion["fondo-reserva"] ?? 0;
  const expensasA = totalRounded - extraordinarias - fondoReserva;

  // 7. Assemble result
  const data: Partial<LiquidacionFull> = {
    month: meta.month ?? "",
    label: meta.label ?? "",
    total: totalRounded,
    expensasA: Math.round(expensasA * 100) / 100,
    items: items.map((i) => ({
      category: i.category as ExpenseCategory,
      description: i.description,
      amount: Math.round(i.amount * 100) / 100,
    })),
    egresosPorSeccion,
  };

  if (meta.periodo) data.periodo = meta.periodo;
  if (meta.vencimiento) data.vencimiento = meta.vencimiento;
  if (meta.aviso) data.aviso = meta.aviso;

  if (meta.cashFlow) {
    data.cashFlow = {
      saldoAnterior: meta.cashFlow.saldoAnterior ?? 0,
      ingresos: meta.cashFlow.ingresos ?? 0,
      egresos: meta.cashFlow.egresos ?? 0,
      extras: [],
      saldoFinal: meta.cashFlow.saldoFinal ?? 0,
    };
  }

  if (meta.prorrateo) {
    data.prorrateo = {
      expensasA: meta.prorrateo.expensasA ?? expensasA,
      expensasB: meta.prorrateo.expensasB ?? 0,
      totalAPagar: meta.prorrateo.totalAPagar ?? totalRounded,
    };
  }

  // 8. Calculate confidence
  let confidence: "high" | "medium" | "low" = "high";
  if (!meta.month) confidence = "medium";
  if (items.length < 3) confidence = "medium";
  if (items.length === 0) confidence = "low";
  if (extraction.allLines.length < 5) confidence = "low";

  // Check for many "otros" items — might indicate poor category matching
  const otrosCount = items.filter((i) => i.category === "otros").length;
  if (otrosCount > items.length * 0.5 && items.length > 3) {
    warnings.push(
      `${otrosCount} de ${items.length} items fueron clasificados como "otros". Revisá las categorías.`
    );
    if (confidence === "high") confidence = "medium";
  }

  return {
    data,
    rawText: extraction.rawText,
    confidence,
    warnings,
  };
}
