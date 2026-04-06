"use server";

import { parsePdf } from "@/lib/parse-pdf";
import {
  saveLiquidacion,
  createBuilding,
  isDbConfigured,
} from "@/lib/db";
import type { LiquidacionFull, Building } from "@/types/expense";

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
  buildingId: string,
  data: LiquidacionFull
): Promise<{ success: true } | { error: string }> {
  if (!isDbConfigured()) {
    return { error: "DATABASE_URL no está configurada" };
  }

  try {
    await saveLiquidacion(buildingId, data);
    return { success: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Error al guardar",
    };
  }
}

export async function createBuildingAction(
  data: { name: string; address: string; adminCompany?: string }
): Promise<Building | { error: string }> {
  if (!isDbConfigured()) {
    return { error: "DATABASE_URL no está configurada" };
  }

  try {
    const building = await createBuilding(data);
    return building;
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Error al crear el edificio",
    };
  }
}
