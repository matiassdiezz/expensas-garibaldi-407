#!/usr/bin/env node
// Audit script: cross-references data.ts vs liquidaciones.json
// READ-ONLY — does not modify any files

const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────
// 1. LOAD DATA
// ─────────────────────────────────────────────

const jsonPath = path.join(__dirname, "src/lib/liquidaciones.json");
const tsPath = path.join(__dirname, "src/lib/data.ts");

const liquidacionesRaw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const liquidaciones = liquidacionesRaw.liquidaciones; // array

// Parse data.ts: extract the array literal as JSON-compatible text
const tsSource = fs.readFileSync(tsPath, "utf8");
// Strip TS types and import, eval the array
// We'll use a simple regex extraction approach:
// Find everything between "expensasData: MonthData[] = [" and the closing "];"
const tsArrayMatch = tsSource.match(
  /export const expensasData[^=]*=\s*(\[[\s\S]*\]);?\s*$/
);
if (!tsArrayMatch) {
  console.error("Could not parse data.ts array");
  process.exit(1);
}

// Convert TS object literal to valid JSON:
// 1. Remove trailing commas before ] or }
// 2. Quote unquoted keys
let arrayText = tsArrayMatch[1];
// Remove single-line comments
arrayText = arrayText.replace(/\/\/[^\n]*/g, "");
// Remove trailing commas before ] or }
arrayText = arrayText.replace(/,(\s*[}\]])/g, "$1");
// Quote unquoted object keys
arrayText = arrayText.replace(/([{,]\s*)(\w[\w-]*)(\s*:)/g, '$1"$2"$3');
// Replace single quotes with double quotes (there are none here but just in case)
arrayText = arrayText.replace(/'/g, '"');

let staticData;
try {
  staticData = JSON.parse(arrayText);
} catch (e) {
  console.error("JSON parse error:", e.message);
  // Debug: show snippet around error
  if (e.message.match(/position (\d+)/)) {
    const pos = parseInt(e.message.match(/position (\d+)/)[1]);
    console.error("Context:", arrayText.substring(Math.max(0, pos - 50), pos + 50));
  }
  process.exit(1);
}

// ─────────────────────────────────────────────
// 2. HELPERS
// ─────────────────────────────────────────────

let issues = 0;
let checks = 0;

function pass(msg) {
  checks++;
  console.log(`  ✅ ${msg}`);
}

function fail(msg) {
  checks++;
  issues++;
  console.log(`  ❌ ${msg}`);
}

function header(title) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`## ${title}`);
  console.log("─".repeat(60));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function approxEq(a, b, tol = 1) {
  return Math.abs(a - b) <= tol;
}

// Category mapping: data.ts category → JSON section key
const CAT_MAP = {
  "sueldos":           "A_sueldos",
  "cargas-sociales":   "B_cargas_sociales",
  "servicios-publicos": "C_servicios_publicos",
  "abonos-servicios":  "D_abonos_servicios",
  "mantenimiento":     "E_mantenimiento",
  "reparaciones":      "F_reparaciones",
  "gastos-bancarios":  "G_gastos_bancarios",
  "seguros-gastos":    "H_seguros_gastos",
  "administracion":    "I_administracion",
};

// Build lookup maps
const jsonByMonth = {};
for (const liq of liquidaciones) {
  jsonByMonth[liq.liquidacion] = liq;
}

const tsMonths = staticData.map((d) => d.month);
const jsonMonths = liquidaciones.map((l) => l.liquidacion);

// ─────────────────────────────────────────────
// CHECK 1: STRUCTURAL
// ─────────────────────────────────────────────
header("1. Structural Checks");

// 1a. Months in data.ts vs liquidaciones.json
const tsSet = new Set(tsMonths);
const jsonSet = new Set(jsonMonths);

console.log(`  data.ts months (${tsMonths.length}): ${tsMonths.join(", ")}`);
console.log(`  JSON months   (${jsonMonths.length}): ${jsonMonths.join(", ")}`);

const onlyInTs = tsMonths.filter((m) => !jsonSet.has(m));
const onlyInJson = jsonMonths.filter((m) => !tsSet.has(m));

if (onlyInTs.length === 0) {
  pass("All data.ts months exist in liquidaciones.json");
} else {
  fail(`Months in data.ts NOT in liquidaciones.json: ${onlyInTs.join(", ")}`);
}

if (onlyInJson.length === 0) {
  pass("All liquidaciones.json months exist in data.ts");
} else {
  fail(`Months in liquidaciones.json NOT in data.ts: ${onlyInJson.join(", ")}`);
}

// 1b. Duplicates
const tsDups = tsMonths.filter((m, i) => tsMonths.indexOf(m) !== i);
const jsonDups = jsonMonths.filter((m, i) => jsonMonths.indexOf(m) !== i);

if (tsDups.length === 0) pass("No duplicate months in data.ts");
else fail(`Duplicate months in data.ts: ${tsDups.join(", ")}`);

if (jsonDups.length === 0) pass("No duplicate months in liquidaciones.json");
else fail(`Duplicate months in liquidaciones.json: ${jsonDups.join(", ")}`);

// ─────────────────────────────────────────────
// CHECK 2: TOTAL CONSISTENCY
// ─────────────────────────────────────────────
header("2. Total Consistency");

for (const tsEntry of staticData) {
  const m = tsEntry.month;
  const jsonEntry = jsonByMonth[m];
  if (!jsonEntry) continue; // already flagged above

  // 2a. Sum of items === total in data.ts
  const itemSum = round2(
    tsEntry.items.reduce((acc, it) => acc + it.amount, 0)
  );
  const tsDeclaredTotal = tsEntry.total;
  if (approxEq(itemSum, tsDeclaredTotal)) {
    pass(`${m}: items sum (${itemSum.toLocaleString("es-AR")}) === declared total (${tsDeclaredTotal.toLocaleString("es-AR")})`);
  } else {
    fail(
      `${m}: items sum (${itemSum.toLocaleString("es-AR")}) ≠ declared total (${tsDeclaredTotal.toLocaleString("es-AR")}) — diff: ${round2(itemSum - tsDeclaredTotal).toLocaleString("es-AR")}`
    );
  }

  // 2b. data.ts total vs egresos.total in JSON
  const jsonEgresosTotal = jsonEntry.egresos.total;
  if (approxEq(tsDeclaredTotal, jsonEgresosTotal)) {
    pass(`${m}: data.ts total (${tsDeclaredTotal.toLocaleString("es-AR")}) ≈ JSON egresos.total (${jsonEgresosTotal.toLocaleString("es-AR")})`);
  } else {
    fail(
      `${m}: data.ts total (${tsDeclaredTotal.toLocaleString("es-AR")}) ≠ JSON egresos.total (${jsonEgresosTotal.toLocaleString("es-AR")}) — diff: ${round2(tsDeclaredTotal - jsonEgresosTotal).toLocaleString("es-AR")}`
    );
  }

  // 2c. Sum of JSON secciones === JSON egresos.total
  const secciones = jsonEntry.egresos.secciones;
  const seccionesSum = round2(Object.values(secciones).reduce((a, b) => a + b, 0));
  if (approxEq(seccionesSum, jsonEgresosTotal)) {
    pass(`${m}: sum of JSON secciones (${seccionesSum.toLocaleString("es-AR")}) ≈ JSON egresos.total (${jsonEgresosTotal.toLocaleString("es-AR")})`);
  } else {
    fail(
      `${m}: sum of JSON secciones (${seccionesSum.toLocaleString("es-AR")}) ≠ JSON egresos.total (${jsonEgresosTotal.toLocaleString("es-AR")}) — diff: ${round2(seccionesSum - jsonEgresosTotal).toLocaleString("es-AR")}`
    );
  }
}

// ─────────────────────────────────────────────
// CHECK 3: CATEGORY MAPPING
// ─────────────────────────────────────────────
header("3. Category Mapping (per month, per category)");

for (const tsEntry of staticData) {
  const m = tsEntry.month;
  const jsonEntry = jsonByMonth[m];
  if (!jsonEntry) continue;

  const secciones = jsonEntry.egresos.secciones;

  // Group items by category
  const tsByCat = {};
  for (const item of tsEntry.items) {
    const cat = item.category;
    tsByCat[cat] = round2((tsByCat[cat] || 0) + item.amount);
  }

  // Unknown categories
  for (const cat of Object.keys(tsByCat)) {
    if (!CAT_MAP[cat]) {
      fail(`${m}: Unknown category in data.ts: "${cat}"`);
    }
  }

  // Compare each mapped category
  let monthOk = true;
  for (const [tsCat, jsonKey] of Object.entries(CAT_MAP)) {
    const tsAmt = tsByCat[tsCat] || 0;
    const jsonAmt = secciones[jsonKey] || 0;

    if (!approxEq(tsAmt, jsonAmt)) {
      monthOk = false;
      fail(
        `${m} [${tsCat}]: data.ts sum ${tsAmt.toLocaleString("es-AR")} ≠ JSON ${jsonKey} ${jsonAmt.toLocaleString("es-AR")} — diff: ${round2(tsAmt - jsonAmt).toLocaleString("es-AR")}`
      );
    }

    // Flag one-sided
    if (tsAmt > 0 && jsonAmt === 0) {
      fail(`${m} [${tsCat}]: data.ts has items (${tsAmt.toLocaleString("es-AR")}) but JSON shows 0`);
    } else if (tsAmt === 0 && jsonAmt > 0) {
      fail(`${m} [${tsCat}]: JSON has ${jsonAmt.toLocaleString("es-AR")} but data.ts has no items`);
    }
  }

  if (monthOk) pass(`${m}: all category sums match JSON secciones`);
}

// ─────────────────────────────────────────────
// CHECK 4: CASHFLOW SANITY
// ─────────────────────────────────────────────
header("4. CashFlow Sanity");

// Sort both by month for consecutive checks
const sortedLiqs = [...liquidaciones].sort((a, b) =>
  a.liquidacion.localeCompare(b.liquidacion)
);

for (const liq of sortedLiqs) {
  const m = liq.liquidacion;
  const cf = liq.cashFlow;

  // 4a. saldoAnterior + ingresos - egresos + sum(extras) === saldoFinal
  const extrasSum = round2(
    (cf.extras || []).reduce((acc, e) => acc + e.monto, 0)
  );
  const computed = round2(cf.saldoAnterior + cf.ingresos - cf.egresos + extrasSum);
  const declared = cf.saldoFinal;

  if (approxEq(computed, declared)) {
    pass(
      `${m}: cashFlow balances — saldoAnterior(${cf.saldoAnterior.toLocaleString("es-AR")}) + ingresos(${cf.ingresos.toLocaleString("es-AR")}) - egresos(${cf.egresos.toLocaleString("es-AR")}) + extras(${extrasSum.toLocaleString("es-AR")}) = ${computed.toLocaleString("es-AR")} ≈ saldoFinal(${declared.toLocaleString("es-AR")})`
    );
  } else {
    fail(
      `${m}: cashFlow IMBALANCE — computed saldoFinal: ${computed.toLocaleString("es-AR")} ≠ declared saldoFinal: ${declared.toLocaleString("es-AR")} (diff: ${round2(computed - declared).toLocaleString("es-AR")})`
    );
  }

  // 4b. cashFlow.egresos ≈ egresos.total (allow $1000 tolerance)
  const cfEgresos = cf.egresos;
  const egTotal = liq.egresos.total;
  if (approxEq(cfEgresos, egTotal, 1000)) {
    pass(`${m}: cashFlow.egresos (${cfEgresos.toLocaleString("es-AR")}) ≈ egresos.total (${egTotal.toLocaleString("es-AR")})`);
  } else {
    fail(
      `${m}: cashFlow.egresos (${cfEgresos.toLocaleString("es-AR")}) differs from egresos.total (${egTotal.toLocaleString("es-AR")}) by more than $1000 — diff: ${round2(cfEgresos - egTotal).toLocaleString("es-AR")}`
    );
  }
}

// 4c. Consecutive months: saldoFinal[N] === saldoAnterior[N+1]
for (let i = 0; i < sortedLiqs.length - 1; i++) {
  const cur = sortedLiqs[i];
  const next = sortedLiqs[i + 1];
  const curFinal = cur.cashFlow.saldoFinal;
  const nextAnterior = next.cashFlow.saldoAnterior;

  if (approxEq(curFinal, nextAnterior)) {
    pass(
      `Chain: ${cur.liquidacion}.saldoFinal (${curFinal.toLocaleString("es-AR")}) === ${next.liquidacion}.saldoAnterior (${nextAnterior.toLocaleString("es-AR")})`
    );
  } else {
    fail(
      `Chain BREAK: ${cur.liquidacion}.saldoFinal (${curFinal.toLocaleString("es-AR")}) ≠ ${next.liquidacion}.saldoAnterior (${nextAnterior.toLocaleString("es-AR")}) — diff: ${round2(curFinal - nextAnterior).toLocaleString("es-AR")}`
    );
  }
}

// ─────────────────────────────────────────────
// CHECK 5: PRORRATEO SANITY
// ─────────────────────────────────────────────
header("5. Prorrateo Sanity");

for (const liq of sortedLiqs) {
  const m = liq.liquidacion;
  const p = liq.prorrateo;
  const tsEntry = staticData.find((d) => d.month === m);

  // 5a. expensasA + expensasB === totalAPagar
  const computedTotal = round2(p.expensasA + p.expensasB);
  if (approxEq(computedTotal, p.totalAPagar)) {
    pass(`${m}: prorrateo A(${p.expensasA.toLocaleString("es-AR")}) + B(${p.expensasB.toLocaleString("es-AR")}) = ${computedTotal.toLocaleString("es-AR")} ≈ totalAPagar(${p.totalAPagar.toLocaleString("es-AR")})`);
  } else {
    fail(
      `${m}: prorrateo A+B (${computedTotal.toLocaleString("es-AR")}) ≠ totalAPagar (${p.totalAPagar.toLocaleString("es-AR")}) — diff: ${round2(computedTotal - p.totalAPagar).toLocaleString("es-AR")}`
    );
  }

  // 5b. prorrateo.expensasA === data.ts expensasA
  if (tsEntry) {
    if (approxEq(p.expensasA, tsEntry.expensasA)) {
      pass(`${m}: JSON prorrateo.expensasA (${p.expensasA.toLocaleString("es-AR")}) === data.ts expensasA (${tsEntry.expensasA.toLocaleString("es-AR")})`);
    } else {
      fail(
        `${m}: JSON prorrateo.expensasA (${p.expensasA.toLocaleString("es-AR")}) ≠ data.ts expensasA (${tsEntry.expensasA.toLocaleString("es-AR")}) — diff: ${round2(p.expensasA - tsEntry.expensasA).toLocaleString("es-AR")}`
      );
    }
  }
}

// ─────────────────────────────────────────────
// CHECK 6: ufDiez CONSISTENCY
// ─────────────────────────────────────────────
header("6. ufDiez / expensasA Consistency (6.40%)");

for (const tsEntry of staticData) {
  const m = tsEntry.month;
  const expected = round2(tsEntry.expensasA * 0.064);
  const actual = tsEntry.ufDiez;
  if (approxEq(actual, expected, 100)) {
    pass(`${m}: ufDiez(${actual.toLocaleString("es-AR")}) ≈ expensasA × 6.40% (${expected.toLocaleString("es-AR")})`);
  } else {
    fail(
      `${m}: ufDiez(${actual.toLocaleString("es-AR")}) ≠ expensasA(${tsEntry.expensasA.toLocaleString("es-AR")}) × 6.40% = ${expected.toLocaleString("es-AR")} — diff: ${round2(actual - expected).toLocaleString("es-AR")}`
    );
  }
}

// ─────────────────────────────────────────────
// CHECK 7: DATA QUALITY
// ─────────────────────────────────────────────
header("7. Data Quality");

const MONTH_REGEX = /^\d{4}-\d{2}$/;
const LABEL_SPANISH = /^(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+\d{4}$/;

for (const tsEntry of staticData) {
  const m = tsEntry.month;

  // Month format
  if (MONTH_REGEX.test(m)) {
    pass(`${m}: month key format YYYY-MM ✓`);
  } else {
    fail(`${m}: invalid month format "${m}"`);
  }

  // Label format (note: some labels have "(rectificativa 1)" suffix in JSON, but data.ts labels are clean)
  if (LABEL_SPANISH.test(tsEntry.label)) {
    pass(`${m}: label "${tsEntry.label}" is valid Spanish month format`);
  } else {
    fail(`${m}: label "${tsEntry.label}" does not match "Mes YYYY" format`);
  }

  // Per-item checks
  for (const item of tsEntry.items) {
    if (item.amount < 0) {
      fail(`${m} item "${item.description}": negative amount (${item.amount})`);
    }
    if (!item.description || item.description.trim() === "") {
      fail(`${m}: item with empty description (amount: ${item.amount})`);
    }
    if (item.amount === 0) {
      fail(`${m} item "${item.description}": amount is zero`);
    }
  }
}

// Count items with issues (check across all)
let negCount = 0, emptyCount = 0, zeroCount = 0;
for (const tsEntry of staticData) {
  for (const item of tsEntry.items) {
    if (item.amount < 0) negCount++;
    if (!item.description || item.description.trim() === "") emptyCount++;
    if (item.amount === 0) zeroCount++;
  }
}

const totalItems = staticData.reduce((a, d) => a + d.items.length, 0);
pass(`Total items in data.ts: ${totalItems} across ${staticData.length} months`);
if (negCount === 0) pass("No negative amounts in items");
if (emptyCount === 0) pass("No empty descriptions");
if (zeroCount === 0) pass("No zero-amount items");

// ─────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────
console.log(`\n${"═".repeat(60)}`);
console.log("## AUDIT SUMMARY");
console.log("═".repeat(60));
console.log(`  Total checks run : ${checks}`);
console.log(`  Issues found     : ${issues}`);
console.log(`  Passed           : ${checks - issues}`);

if (issues === 0) {
  console.log("\n  ✅ ALL CHECKS PASSED — data integrity confirmed.");
} else {
  console.log(`\n  ❌ ${issues} issue(s) found — review details above.`);
}
console.log("");
