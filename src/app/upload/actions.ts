"use server";

import { parsePdf } from "@/lib/parse-pdf";
import { saveLiquidacion, isDbConfigured } from "@/lib/db";
import type { LiquidacionFull } from "@/types/expense";

export async function parsePdfAction(
  base64: string
): Promise<LiquidacionFull | { error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "ANTHROPIC_API_KEY no está configurada" };
  }

  try {
    const result = await parsePdf(base64);
    return result;
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Error al parsear el PDF",
    };
  }
}

export async function saveLiquidacionAction(
  data: LiquidacionFull
): Promise<{ success: true } | { error: string }> {
  if (!isDbConfigured()) {
    return { error: "DATABASE_URL no está configurada" };
  }

  try {
    await saveLiquidacion(data);
    return { success: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Error al guardar",
    };
  }
}
