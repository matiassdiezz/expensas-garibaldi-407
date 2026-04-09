import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { neon } from "@neondatabase/serverless";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

const STANDARD_CATEGORIES = [
  "sueldos",
  "cargas-sociales",
  "servicios-publicos",
  "abonos-servicios",
  "mantenimiento",
  "reparaciones",
  "gastos-bancarios",
  "seguros-gastos",
  "administracion",
  "impuestos",
  "ascensores",
  "limpieza",
  "extraordinarias",
  "fondo-reserva",
  "otros",
];

const STANDARD_CATEGORIES_SET = new Set(STANDARD_CATEGORIES);

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

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = stripWrappingQuotes(rawValue.trim());
  }
}

loadEnvFile(join(REPO_ROOT, ".env.local"));
loadEnvFile(join(REPO_ROOT, ".env"));

function assertEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} no está configurada. Revisá .env.local o exportala antes de correr el script.`);
  }
  return value;
}

export function createQuery() {
  return neon(assertEnv("DATABASE_URL"));
}

export function createAnthropicClient() {
  assertEnv("ANTHROPIC_API_KEY");
  return new Anthropic();
}

export function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatCurrency(value) {
  return `$${Number(value).toLocaleString("es-AR")}`;
}

export function monthToLabel(month) {
  const [year, monthNum] = String(month).split("-");
  const labels = {
    "01": "Enero",
    "02": "Febrero",
    "03": "Marzo",
    "04": "Abril",
    "05": "Mayo",
    "06": "Junio",
    "07": "Julio",
    "08": "Agosto",
    "09": "Septiembre",
    "10": "Octubre",
    "11": "Noviembre",
    "12": "Diciembre",
  };
  return labels[monthNum] ? `${labels[monthNum]} ${year}` : String(month);
}

export function listPdfFiles(dirPath) {
  if (!existsSync(dirPath)) {
    throw new Error(`No existe el directorio: ${dirPath}`);
  }

  return readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
    .map((entry) => join(dirPath, entry.name))
    .sort((a, b) =>
      basename(a).localeCompare(basename(b), "es", {
        numeric: true,
        sensitivity: "base",
      })
    );
}

export async function ensureBuilding(query, { name, address, adminCompany, cuit }) {
  const slug = generateSlug(name);
  const existing = await query`SELECT id FROM buildings WHERE slug = ${slug} LIMIT 1`;

  if (existing.length > 0) {
    return {
      id: existing[0].id,
      slug,
      created: false,
    };
  }

  const id = crypto.randomUUID();
  await query`
    INSERT INTO buildings (id, slug, name, address, admin_company, cuit)
    VALUES (${id}, ${slug}, ${name}, ${address}, ${adminCompany ?? null}, ${cuit ?? null})
  `;

  return {
    id,
    slug,
    created: true,
  };
}

function normalizeParsed(parsed) {
  if (!/^\d{4}-\d{2}$/.test(parsed.month)) {
    throw new Error(`Formato de month inválido: "${parsed.month}" — esperado YYYY-MM`);
  }

  for (const item of parsed.items) {
    if (!STANDARD_CATEGORIES_SET.has(item.category)) {
      console.warn(`  ⚠ Categoría no estándar: "${item.category}" → "otros"`);
      item.category = "otros";
    }
  }

  if (parsed.egresosPorSeccion) {
    const normalized = {};
    for (const [key, value] of Object.entries(parsed.egresosPorSeccion)) {
      if (STANDARD_CATEGORIES_SET.has(key)) {
        normalized[key] = (normalized[key] ?? 0) + value;
      } else {
        console.warn(`  ⚠ Sección no estándar: "${key}" → "otros"`);
        normalized.otros = (normalized.otros ?? 0) + value;
      }
    }
    parsed.egresosPorSeccion = normalized;
  }

  const itemsTotal = parsed.items.reduce((sum, item) => sum + item.amount, 0);
  const diff = Math.abs(parsed.total - itemsTotal);
  if (diff > 1) {
    console.warn(`  ⚠ Total ajustado: ${formatCurrency(parsed.total)} → ${formatCurrency(itemsTotal)}`);
    parsed.total = Math.round(itemsTotal * 100) / 100;
  }

  return parsed;
}

export async function parsePdfFile(client, pdfPath) {
  const pdfBuffer = readFileSync(pdfPath);
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
              data: pdfBuffer.toString("base64"),
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
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const parsed = normalizeParsed(JSON.parse(text));

  return {
    parsed,
    sizeKb: Number((pdfBuffer.length / 1024).toFixed(1)),
  };
}

export async function saveLiquidacion(query, buildingId, parsed) {
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
}

export function buildJsonPayload(meta, liquidaciones) {
  return {
    _meta: {
      slug: generateSlug(meta.name),
      nombre: meta.name,
      direccion: meta.address,
      administracion: meta.adminCompany ?? null,
      cuit: meta.cuit ?? null,
    },
    liquidaciones: liquidaciones
      .slice()
      .sort((a, b) => String(a.month).localeCompare(String(b.month)))
      .map((liq) => ({
        liquidacion: liq.month,
        label: liq.label ?? monthToLabel(liq.month),
        total: liq.total,
        expensasA: liq.expensasA,
        items: liq.items,
        periodo: liq.periodo ?? null,
        vencimiento: liq.vencimiento ?? null,
        cashFlow: liq.cashFlow ?? null,
        prorrateo: liq.prorrateo ?? null,
        egresosPorSeccion: liq.egresosPorSeccion ?? null,
        aviso: liq.aviso ?? null,
        sourcePdf: liq.sourcePdf ?? null,
      })),
  };
}

export function writeJsonFile(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
