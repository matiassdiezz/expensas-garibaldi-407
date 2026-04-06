/**
 * Load a PDF liquidación into the database for a building.
 *
 * Usage:
 *   DATABASE_URL=... ANTHROPIC_API_KEY=... npx tsx scripts/load-pdf.ts \
 *     --pdf /path/to/file.pdf \
 *     --building "Laprida 195" \
 *     --address "Laprida 195, San Isidro, Buenos Aires" \
 *     --admin "Solución Inmobiliaria" \
 *     --cuit "33-71922229-9"
 */

import { readFileSync } from "fs";
import { neon } from "@neondatabase/serverless";
import Anthropic from "@anthropic-ai/sdk";
import { STANDARD_CATEGORIES } from "../src/types/expense";
import type { LiquidacionFull } from "../src/types/expense";

const STANDARD_CATEGORIES_SET = new Set<string>(STANDARD_CATEGORIES);

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : undefined;
  };
  return {
    pdf: get("--pdf")!,
    building: get("--building")!,
    address: get("--address")!,
    admin: get("--admin"),
    cuit: get("--cuit"),
  };
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
- Si alguna sección del PDF no existe o no aplica, omitila del JSON (los campos son opcionales)
- IMPORTANTE: Si hay Gastos A y Gastos B separados, "total" debe ser la suma de AMBOS (A + B)`;

async function main() {
  const { pdf, building, address, admin, cuit } = parseArgs();

  if (!pdf || !building || !address) {
    console.error("Usage: npx tsx scripts/load-pdf.ts --pdf <path> --building <name> --address <addr> [--admin <name>] [--cuit <cuit>]");
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { console.error("DATABASE_URL is not set"); process.exit(1); }
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY is not set"); process.exit(1); }

  const query = neon(dbUrl);
  const slug = generateSlug(building);

  // 1. Get or create building
  let rows = await query`SELECT * FROM buildings WHERE slug = ${slug} LIMIT 1`;
  let buildingId: string;

  if (rows.length > 0) {
    buildingId = rows[0].id as string;
    console.log(`Building exists: ${building} (${buildingId})`);
  } else {
    buildingId = crypto.randomUUID();
    await query`
      INSERT INTO buildings (id, slug, name, address, admin_company, cuit)
      VALUES (${buildingId}, ${slug}, ${building}, ${address}, ${admin ?? null}, ${cuit ?? null})
    `;
    console.log(`Building created: ${building} → /edificio/${slug} (${buildingId})`);
  }

  // 2. Read PDF and convert to base64
  console.log(`\nReading PDF: ${pdf}`);
  const pdfBuffer = readFileSync(pdf);
  const pdfBase64 = pdfBuffer.toString("base64");
  console.log(`  Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

  // 3. Parse with Claude
  console.log(`\nParsing with Claude...`);
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
            source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
          },
          { type: "text", text: PARSE_PROMPT },
        ],
      },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const parsed = JSON.parse(text) as LiquidacionFull;
  console.log(`  Month: ${parsed.label} (${parsed.month})`);
  console.log(`  Total: $${parsed.total.toLocaleString("es-AR")}`);
  console.log(`  Items: ${parsed.items.length}`);

  // 4. Validate categories
  for (const item of parsed.items) {
    if (!STANDARD_CATEGORIES_SET.has(item.category)) {
      console.warn(`  ⚠ Categoría no estándar: "${item.category}" → "otros"`);
      item.category = "otros";
    }
  }

  // Normalize egresosPorSeccion
  if (parsed.egresosPorSeccion) {
    const normalized: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed.egresosPorSeccion) as [string, number][]) {
      if (STANDARD_CATEGORIES_SET.has(key)) {
        normalized[key] = (normalized[key] ?? 0) + value;
      } else {
        console.warn(`  ⚠ Sección no estándar: "${key}" → "otros"`);
        normalized["otros"] = (normalized["otros"] ?? 0) + value;
      }
    }
    parsed.egresosPorSeccion = normalized;
  }

  // Auto-correct total
  const itemsTotal = parsed.items.reduce((sum, item) => sum + item.amount, 0);
  const diff = Math.abs(parsed.total - itemsTotal);
  if (diff > 1) {
    console.warn(`  ⚠ Total ajustado: $${parsed.total} → $${itemsTotal}`);
    parsed.total = Math.round(itemsTotal * 100) / 100;
  }

  // 5. Print parsed data
  console.log(`\n  Items parseados:`);
  for (const item of parsed.items) {
    console.log(`    [${item.category}] ${item.description}: $${item.amount.toLocaleString("es-AR")}`);
  }

  if (parsed.cashFlow) {
    console.log(`\n  Cash Flow:`);
    console.log(`    Saldo anterior: $${parsed.cashFlow.saldoAnterior?.toLocaleString("es-AR")}`);
    console.log(`    Ingresos: $${parsed.cashFlow.ingresos?.toLocaleString("es-AR")}`);
    console.log(`    Saldo final: $${parsed.cashFlow.saldoFinal?.toLocaleString("es-AR")}`);
  }

  // 6. Save to DB
  console.log(`\nSaving to DB...`);
  await query`
    INSERT INTO liquidaciones (building_id, month, label, total, expensas_a, items, periodo, vencimiento, cash_flow, prorrateo, egresos_por_seccion, aviso)
    VALUES (
      ${buildingId},
      ${parsed.month},
      ${parsed.label},
      ${parsed.total},
      ${parsed.expensasA},
      ${JSON.stringify(parsed.items)}::jsonb,
      ${parsed.periodo ?? null},
      ${parsed.vencimiento ?? null},
      ${parsed.cashFlow ? JSON.stringify(parsed.cashFlow) : null}::jsonb,
      ${parsed.prorrateo ? JSON.stringify(parsed.prorrateo) : null}::jsonb,
      ${parsed.egresosPorSeccion ? JSON.stringify(parsed.egresosPorSeccion) : null}::jsonb,
      ${parsed.aviso ?? null}
    )
    ON CONFLICT (building_id, month) DO UPDATE SET
      label = EXCLUDED.label,
      total = EXCLUDED.total,
      expensas_a = EXCLUDED.expensas_a,
      items = EXCLUDED.items,
      periodo = EXCLUDED.periodo,
      vencimiento = EXCLUDED.vencimiento,
      cash_flow = EXCLUDED.cash_flow,
      prorrateo = EXCLUDED.prorrateo,
      egresos_por_seccion = EXCLUDED.egresos_por_seccion,
      aviso = EXCLUDED.aviso
  `;

  console.log(`\n✅ Done! ${parsed.label} saved for ${building}`);
  console.log(`   View at: https://expensas-garibaldi-407.vercel.app/edificio/${slug}`);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
