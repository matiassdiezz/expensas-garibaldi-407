#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createQuery,
  ensureBuilding,
  monthToLabel,
  saveLiquidacion,
} from "./lib/load-pdf-core.mjs";

function parseArgs(argv = process.argv.slice(2)) {
  const get = (flag) => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };

  return {
    json: get("--json"),
    dryRun: argv.includes("--dry-run"),
  };
}

function printUsage() {
  console.error("Usage: npm run seed:json -- --json <path/to/data.json> [--dry-run]");
}

const args = parseArgs();

if (!args.json) {
  printUsage();
  process.exit(1);
}

const filePath = resolve(args.json);
const raw = JSON.parse(readFileSync(filePath, "utf8"));

if (!raw?._meta?.nombre || !raw?._meta?.direccion || !Array.isArray(raw?.liquidaciones)) {
  throw new Error("JSON inválido: esperaba _meta.nombre, _meta.direccion y liquidaciones[]");
}

if (args.dryRun) {
  console.log(`Dry run: ${raw.liquidaciones.length} liquidaciones listas para ${raw._meta.nombre}`);
  for (const liq of raw.liquidaciones) {
    console.log(`  ${liq.liquidacion} · ${liq.label ?? monthToLabel(liq.liquidacion)} · ${liq.sourcePdf ?? "sin sourcePdf"}`);
  }
  process.exit(0);
}

const query = createQuery();
const building = await ensureBuilding(query, {
  name: raw._meta.nombre,
  address: raw._meta.direccion,
  adminCompany: raw._meta.administracion ?? undefined,
  cuit: raw._meta.cuit ?? undefined,
});

if (building.created) {
  console.log(`Building created: ${raw._meta.nombre} → /edificio/${building.slug} (${building.id})`);
} else {
  console.log(`Building exists: ${raw._meta.nombre} (${building.id})`);
}

for (const liq of raw.liquidaciones) {
  await saveLiquidacion(query, building.id, {
    month: liq.liquidacion,
    label: liq.label ?? monthToLabel(liq.liquidacion),
    total: liq.total,
    expensasA: liq.expensasA,
    items: liq.items ?? [],
    periodo: liq.periodo ?? undefined,
    vencimiento: liq.vencimiento ?? undefined,
    cashFlow: liq.cashFlow ?? undefined,
    prorrateo: liq.prorrateo ?? undefined,
    egresosPorSeccion: liq.egresosPorSeccion ?? undefined,
    aviso: liq.aviso ?? undefined,
  });

  console.log(`  ✓ ${liq.label ?? monthToLabel(liq.liquidacion)}`);
}

console.log(`\n✅ Done! ${raw.liquidaciones.length} liquidaciones insertadas para ${raw._meta.nombre}`);
