import Anthropic from "@anthropic-ai/sdk";
import { STANDARD_CATEGORIES } from "@/types/expense";
import type { LiquidacionFull } from "@/types/expense";

const STANDARD_CATEGORIES_SET = new Set<string>(STANDARD_CATEGORIES);

const PARSE_PROMPT = `Extraé toda la información de esta liquidación de expensas de un consorcio de propietarios argentino.

Este parser es genérico — funciona con cualquier edificio, administración y formato de liquidación.

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin code blocks, sin explicación) con esta estructura exacta:

{
  "month": "YYYY-MM",
  "label": "Mes YYYY",
  "total": 0,
  "expensasA": 0,
  "items": [
    {
      "category": "una de las 15 categorías estándar (ver abajo)",
      "description": "texto descriptivo del item",
      "amount": 0
    }
  ],
  "periodo": "Mes YYYY",
  "vencimiento": "YYYY-MM-DD",
  "cashFlow": {
    "saldoAnterior": 0,
    "saldoAnteriorFecha": "YYYY-MM-DD",
    "ingresos": 0,
    "egresos": 0,
    "extras": [],
    "saldoFinal": 0
  },
  "prorrateo": {
    "expensasA": 0,
    "expensasB": 0,
    "totalAPagar": 0
  },
  "egresosPorSeccion": {
    "sueldos": 0,
    "cargas-sociales": 0,
    "servicios-publicos": 0
  },
  "aviso": "texto del comunicado o null"
}

Categorías estándar — mapeá cada gasto a la más cercana:
- sueldos: Sueldos de encargados, porteros, jornales
- cargas-sociales: Aportes patronales, ART, SUTERH, obra social, sindicato
- servicios-publicos: Agua, luz, gas de partes comunes
- abonos-servicios: Abonos mensuales (matafuegos, desinfección, antenas, etc.)
- mantenimiento: Reparaciones menores, materiales, plomería, cerrajería, pintura
- reparaciones: Obras mayores, arreglos estructurales, reparaciones grandes
- gastos-bancarios: Comisiones bancarias, mantenimiento de cuenta, chequeras
- seguros-gastos: Seguros del consorcio, pólizas, seguros de vida obligatorios
- administracion: Honorarios de administración, gastos administrativos
- impuestos: ABL, IIBB, tasas municipales, rentas
- ascensores: Abono y reparaciones de ascensores
- limpieza: Productos y servicios de limpieza
- extraordinarias: Gastos extraordinarios, derrames, cuotas especiales
- fondo-reserva: Fondo de reserva legal (5% sobre expensas ordinarias u otro %)
- otros: Cualquier gasto que no encaje en las categorías anteriores

Reglas:
- "month" es el mes de la liquidación (encabezado del documento), formato YYYY-MM
- "label" es el nombre del mes en español con el año (ej: "Julio 2025")
- Cada item debe usar UNA de las 15 categorías exactamente como aparecen arriba
- Si un gasto no encaja claramente en ninguna categoría, usá "otros"
- Los montos son números (sin $ ni puntos de miles, usar punto para decimales)
- Si hay cuotas (ej: "Cuota 2/3"), incluirlas en la descripción
- "total" debe ser la suma de todos los items
- "expensasA" es el total de expensas ordinarias (A) del prorrateo
- Si no hay aviso/comunicado de la administración, usar null para "aviso"
- "extras" en cashFlow son movimientos extraordinarios (préstamos, adelantos, etc.) — array vacío si no hay
- "egresosPorSeccion" usa las categorías estándar como claves, solo incluí las que tengan monto > 0
- Si alguna sección del PDF no existe o no aplica, omitila del JSON (los campos son opcionales)`;

export async function parsePdf(
  pdfBase64: string
): Promise<LiquidacionFull> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: PARSE_PROMPT,
          },
        ],
      },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const parsed = JSON.parse(text) as LiquidacionFull;

  // Validate month format (LLM could return "March 2026" instead of "2026-03")
  if (!/^\d{4}-\d{2}$/.test(parsed.month)) {
    throw new Error(`Formato de month inválido: "${parsed.month}" — esperado YYYY-MM`);
  }

  // Validate and normalize categories — map unknown ones to "otros" instead of throwing
  for (const item of parsed.items) {
    if (!STANDARD_CATEGORIES_SET.has(item.category)) {
      console.warn(
        `Categoría no estándar: "${item.category}" en item "${item.description}" — mapeada a "otros"`
      );
      item.category = "otros";
    }
  }

  // Normalize egresosPorSeccion keys — remap non-standard keys to "otros"
  if (parsed.egresosPorSeccion) {
    const normalized: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed.egresosPorSeccion) as [string, number][]) {
      if (STANDARD_CATEGORIES_SET.has(key)) {
        normalized[key] = (normalized[key] ?? 0) + value;
      } else {
        console.warn(
          `Sección no estándar en egresosPorSeccion: "${key}" — mapeada a "otros"`
        );
        normalized["otros"] = (normalized["otros"] ?? 0) + value;
      }
    }
    parsed.egresosPorSeccion = normalized;
  }

  // Validate total matches sum of items — auto-correct if off
  const itemsTotal = parsed.items.reduce((sum, item) => sum + item.amount, 0);
  const diff = Math.abs(parsed.total - itemsTotal);
  if (diff > 1) {
    parsed.total = Math.round(itemsTotal * 100) / 100;
  }

  return parsed;
}
