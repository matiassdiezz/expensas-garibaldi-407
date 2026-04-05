import Anthropic from "@anthropic-ai/sdk";
import type { LiquidacionFull, ExpenseCategory } from "@/types/expense";

const VALID_CATEGORIES: ExpenseCategory[] = [
  "sueldos",
  "cargas-sociales",
  "servicios-publicos",
  "abonos-servicios",
  "mantenimiento",
  "reparaciones",
  "gastos-bancarios",
  "seguros-gastos",
  "administracion",
];

const PARSE_PROMPT = `Extraé toda la información de esta liquidación de expensas de un consorcio de propietarios argentino.

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin code blocks, sin explicación) con esta estructura exacta:

{
  "month": "YYYY-MM",
  "label": "Mes YYYY",
  "total": 0,
  "expensasA": 0,
  "ufDiez": 0,
  "items": [
    {
      "category": "sueldos|cargas-sociales|servicios-publicos|abonos-servicios|mantenimiento|reparaciones|gastos-bancarios|seguros-gastos|administracion",
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
    "A_sueldos": 0,
    "B_cargas_sociales": 0,
    "C_servicios_publicos": 0,
    "D_abonos_servicios": 0,
    "E_mantenimiento": 0,
    "F_reparaciones": 0,
    "G_gastos_bancarios": 0,
    "H_seguros_gastos": 0,
    "I_administracion": 0
  },
  "aviso": "texto del comunicado o null"
}

Reglas:
- El "month" es el mes de la liquidación (encabezado del documento), NO el período que cubre
- La "label" es el nombre del mes de la liquidación en español (ej: "Julio 2025")
- Cada item de gasto debe usar UNA de las 9 categorías listadas exactamente como aparecen
- Los montos son números (sin $ ni puntos de miles, usar punto para decimales)
- Si hay cuotas (ej: "Cuota 2/3"), incluirlas en la descripción
- El "total" debe ser la suma de todos los items
- ufDiez es el monto de la UF 26 (DIEZ, Gonzalo, 6.40%) — si no aparece, calculá 6.40% de expensasA y redondeá
- Si no hay aviso/comunicado de la administración, usar null para "aviso"
- "extras" en cashFlow son movimientos extraordinarios (préstamos de administración, etc.) — array vacío si no hay
- Secciones en egresosPorSeccion: A=sueldos, B=cargas sociales, C=servicios públicos, D=abonos y servicios, E=mantenimiento, F=reparaciones, G=gastos bancarios, H=seguros y gastos, I=administración`;

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

  // Validate categories
  for (const item of parsed.items) {
    if (!VALID_CATEGORIES.includes(item.category)) {
      throw new Error(
        `Categoría inválida: "${item.category}" en item "${item.description}"`
      );
    }
  }

  // Validate total matches sum of items
  const itemsTotal = parsed.items.reduce((sum, item) => sum + item.amount, 0);
  const diff = Math.abs(parsed.total - itemsTotal);
  if (diff > 1) {
    // Auto-correct total to match items
    parsed.total = Math.round(itemsTotal * 100) / 100;
  }

  return parsed;
}
