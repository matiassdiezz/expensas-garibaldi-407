/**
 * Re-parse 3 sample PDFs and compare against existing data.
 * Usage: ANTHROPIC_API_KEY=sk-... node scripts/reparse-test.mjs
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const PDF_DIR = "/Users/matiasdiez/Downloads/Expensas Garibaldi 407";

// Pick 3 representative PDFs: first, middle, last
const TEST_FILES = [
  "Expensas 407 — Marzo 2025.pdf",
  "Expensas 407 — Octubre 2025.pdf",
  "Expensas 407 — Abril 2026.pdf",
];

// Load existing data for comparison
const liquidacionesRaw = JSON.parse(
  fs.readFileSync(
    path.join(
      "/Users/matiasdiez/Documents/GitHub/expensas-garibaldi-407/src/lib",
      "liquidaciones.json"
    ),
    "utf8"
  )
);
const liquidaciones = liquidacionesRaw.liquidaciones;

// Extract expensasData from data.ts (parse manually)
const dataTs = fs.readFileSync(
  path.join(
    "/Users/matiasdiez/Documents/GitHub/expensas-garibaldi-407/src/lib",
    "data.ts"
  ),
  "utf8"
);

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
- ufDiez es el monto de la UF 26 (DIEZ, Gonzalo, 6.40%) — si no aparece, calculá 6.40% de expensasA y redonde��
- Si no hay aviso/comunicado de la administración, usar null para "aviso"
- "extras" en cashFlow son movimientos extraordinarios (préstamos de administración, etc.) — array vacío si no hay
- Secciones en egresosPorSeccion: A=sueldos, B=cargas sociales, C=servicios públicos, D=abonos y servicios, E=mantenimiento, F=reparaciones, G=gastos bancarios, H=seguros y gastos, I=administración`;

const CATEGORY_MAP = {
  sueldos: "A_sueldos",
  "cargas-sociales": "B_cargas_sociales",
  "servicios-publicos": "C_servicios_publicos",
  "abonos-servicios": "D_abonos_servicios",
  mantenimiento: "E_mantenimiento",
  reparaciones: "F_reparaciones",
  "gastos-bancarios": "G_gastos_bancarios",
  "seguros-gastos": "H_seguros_gastos",
  administracion: "I_administracion",
};

function fmt(n) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

async function parsePdf(client, filePath) {
  const pdfBuffer = fs.readFileSync(filePath);
  const base64 = pdfBuffer.toString("base64");

  console.log(`  Enviando a Claude Sonnet...`);
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          },
          { type: "text", text: PARSE_PROMPT },
        ],
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const usage = response.usage;
  console.log(`  Tokens: ${usage.input_tokens} in / ${usage.output_tokens} out`);

  return JSON.parse(text);
}

function compareMonth(fresh, existingLiq, monthKey, dataTs) {
  const issues = [];
  const checks = [];

  // Find this month in data.ts by extracting items between month markers
  // We'll match by month key from the fresh parse
  const liq = existingLiq.find((l) => l.liquidacion === monthKey);

  if (!liq) {
    issues.push(`❌ No se encontró ${monthKey} en liquidaciones.json`);
    return { issues, checks };
  }

  // --- TOTALS ---
  const freshTotal = fresh.items.reduce((s, i) => s + i.amount, 0);
  const liqTotal = liq.egresos.total;
  const totalDiff = Math.abs(freshTotal - liqTotal);
  if (totalDiff < 100) {
    checks.push(`✅ Total egresos: ${fmt(freshTotal)} (fresh) vs ${fmt(liqTotal)} (existente) — diff ${fmt(totalDiff)}`);
  } else {
    issues.push(`❌ Total egresos: ${fmt(freshTotal)} (fresh) vs ${fmt(liqTotal)} (existente) — diff ${fmt(totalDiff)}`);
  }

  // --- EXPENSAS A ---
  const expADiff = Math.abs(fresh.expensasA - liq.prorrateo.expensasA);
  if (expADiff < 100) {
    checks.push(`✅ ExpensasA: ${fmt(fresh.expensasA)} (fresh) vs ${fmt(liq.prorrateo.expensasA)} (existente)`);
  } else {
    issues.push(`❌ ExpensasA: ${fmt(fresh.expensasA)} (fresh) vs ${fmt(liq.prorrateo.expensasA)} (existente) — diff ${fmt(expADiff)}`);
  }

  // --- CASH FLOW ---
  const cf = liq.cashFlow;
  const fcf = fresh.cashFlow;
  if (fcf && cf) {
    const fields = ["saldoAnterior", "ingresos", "egresos", "saldoFinal"];
    for (const f of fields) {
      const diff = Math.abs((fcf[f] ?? 0) - (cf[f] ?? 0));
      if (diff < 100) {
        checks.push(`✅ cashFlow.${f}: ${fmt(fcf[f])} (fresh) vs ${fmt(cf[f])} (existente)`);
      } else {
        issues.push(`❌ cashFlow.${f}: ${fmt(fcf[f])} (fresh) vs ${fmt(cf[f])} (existente) — diff ${fmt(diff)}`);
      }
    }
  }

  // --- SECCIONES ---
  const freshSecciones = fresh.egresosPorSeccion ?? {};
  const existSecciones = liq.egresos.secciones;
  for (const [secKey, existVal] of Object.entries(existSecciones)) {
    const freshVal = freshSecciones[secKey] ?? 0;
    const diff = Math.abs(freshVal - existVal);
    if (diff < 100) {
      if (existVal > 0 || freshVal > 0) {
        checks.push(`✅ ${secKey}: ${fmt(freshVal)} vs ${fmt(existVal)}`);
      }
    } else {
      issues.push(`❌ ${secKey}: ${fmt(freshVal)} (fresh) vs ${fmt(existVal)} (existente) — diff ${fmt(diff)}`);
    }
  }

  // --- ITEMS COUNT & CATEGORIES ---
  // Group fresh items by category
  const freshByCat = {};
  for (const item of fresh.items) {
    freshByCat[item.category] = (freshByCat[item.category] ?? 0) + item.amount;
  }

  // Compare category totals with secciones
  for (const [cat, secKey] of Object.entries(CATEGORY_MAP)) {
    const freshCatTotal = freshByCat[cat] ?? 0;
    const existSecTotal = existSecciones[secKey] ?? 0;
    const diff = Math.abs(freshCatTotal - existSecTotal);
    if (diff > 100 && (freshCatTotal > 0 || existSecTotal > 0)) {
      issues.push(`❌ Categoría ${cat} (items sum): ${fmt(freshCatTotal)} vs sección ${secKey}: ${fmt(existSecTotal)} — diff ${fmt(diff)}`);
    }
  }

  // --- PRORRATEO ---
  if (fresh.prorrateo && liq.prorrateo) {
    const tpDiff = Math.abs(fresh.prorrateo.totalAPagar - liq.prorrateo.totalAPagar);
    if (tpDiff < 100) {
      checks.push(`✅ totalAPagar: ${fmt(fresh.prorrateo.totalAPagar)} vs ${fmt(liq.prorrateo.totalAPagar)}`);
    } else {
      issues.push(`❌ totalAPagar: ${fmt(fresh.prorrateo.totalAPagar)} (fresh) vs ${fmt(liq.prorrateo.totalAPagar)} (existente) — diff ${fmt(tpDiff)}`);
    }
  }

  // --- UF DIEZ ---
  const ufDiff = Math.abs(fresh.ufDiez - (fresh.expensasA * 0.064));
  if (ufDiff < 200) {
    checks.push(`✅ ufDiez: ${fmt(fresh.ufDiez)} (≈ 6.40% de ${fmt(fresh.expensasA)})`);
  } else {
    issues.push(`❌ ufDiez: ${fmt(fresh.ufDiez)} no coincide con 6.40% de ${fmt(fresh.expensasA)}`);
  }

  // --- ITEM COUNT ---
  checks.push(`ℹ️ Items parseados: ${fresh.items.length}`);

  return { issues, checks };
}

async function main() {
  const client = new Anthropic();
  const results = [];

  for (const fileName of TEST_FILES) {
    const filePath = path.join(PDF_DIR, fileName);
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📄 ${fileName}`);
    console.log(`${"=".repeat(60)}`);

    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️ Archivo no encontrado, saltando...`);
      continue;
    }

    const fresh = await parsePdf(client, filePath);
    console.log(`  Parseado: ${fresh.month} — ${fresh.label} — ${fresh.items.length} items — Total: ${fmt(fresh.total)}`);

    const { issues, checks } = compareMonth(fresh, liquidaciones, fresh.month, dataTs);

    console.log(`\n  --- Checks pasados (${checks.length}) ---`);
    for (const c of checks) console.log(`  ${c}`);

    if (issues.length > 0) {
      console.log(`\n  --- ISSUES (${issues.length}) ---`);
      for (const i of issues) console.log(`  ${i}`);
    } else {
      console.log(`\n  ✅ Sin diferencias encontradas`);
    }

    results.push({ file: fileName, month: fresh.month, fresh, issues, checksCount: checks.length });
  }

  // Save fresh parses for reference
  const outPath = path.join(
    "/Users/matiasdiez/Documents/GitHub/expensas-garibaldi-407/scripts",
    "reparse-results.json"
  );
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      results.map((r) => ({ file: r.file, month: r.month, data: r.fresh, issues: r.issues })),
      null,
      2
    )
  );
  console.log(`\n\n📁 Resultados guardados en ${outPath}`);

  // Summary
  const totalIssues = results.reduce((s, r) => s + r.issues.length, 0);
  const totalChecks = results.reduce((s, r) => s + r.checksCount, 0);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`RESUMEN: ${results.length} PDFs parseados, ${totalChecks} checks, ${totalIssues} diferencias`);
  console.log(`${"=".repeat(60)}`);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
