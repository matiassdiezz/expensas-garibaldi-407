#!/usr/bin/env node

import { basename } from "node:path";
import {
  createAnthropicClient,
  ensureBuilding,
  formatCurrency,
  generateSlug,
  parsePdfFile,
  saveLiquidacion,
} from "./lib/load-pdf-core.mjs";

function parseArgs(argv = process.argv.slice(2)) {
  const get = (flag) => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };

  return {
    pdf: get("--pdf"),
    building: get("--building"),
    address: get("--address"),
    admin: get("--admin"),
    cuit: get("--cuit"),
    dryRun: argv.includes("--dry-run"),
  };
}

function printUsage() {
  console.error(
    "Usage: npm run load:pdf -- --pdf <path> --building <name> --address <addr> [--admin <name>] [--cuit <cuit>] [--dry-run]"
  );
}

const args = parseArgs();

if (!args.pdf || !args.building || !args.address) {
  printUsage();
  process.exit(1);
}

const client = createAnthropicClient();
const slug = generateSlug(args.building);
let building = { id: null, slug, created: false };
let query = null;

if (!args.dryRun) {
  const { createQuery } = await import("./lib/load-pdf-core.mjs");
  query = createQuery();
  building = await ensureBuilding(query, {
    name: args.building,
    address: args.address,
    adminCompany: args.admin,
    cuit: args.cuit,
  });

  if (building.created) {
    console.log(`Building created: ${args.building} → /edificio/${building.slug} (${building.id})`);
  } else {
    console.log(`Building exists: ${args.building} (${building.id})`);
  }
}

console.log(`\nReading PDF: ${args.pdf}`);
const result = await parsePdfFile(client, args.pdf);
console.log(`  File: ${basename(args.pdf)}`);
console.log(`  Size: ${result.sizeKb.toFixed(1)} KB`);
console.log(`  Month: ${result.parsed.label} (${result.parsed.month})`);
console.log(`  Total: ${formatCurrency(result.parsed.total)}`);
console.log(`  Items: ${result.parsed.items.length}`);

console.log("\n  Items parseados:");
for (const item of result.parsed.items) {
  console.log(`    [${item.category}] ${item.description}: ${formatCurrency(item.amount)}`);
}

if (result.parsed.cashFlow) {
  console.log("\n  Cash Flow:");
  console.log(`    Saldo anterior: ${formatCurrency(result.parsed.cashFlow.saldoAnterior)}`);
  console.log(`    Ingresos: ${formatCurrency(result.parsed.cashFlow.ingresos)}`);
  console.log(`    Saldo final: ${formatCurrency(result.parsed.cashFlow.saldoFinal)}`);
}

if (args.dryRun) {
  console.log("\nDry run: no se guardó nada en la base.");
  process.exit(0);
}

console.log("\nSaving to DB...");
await saveLiquidacion(query, building.id, result.parsed);

console.log(`\n✅ Done! ${result.parsed.label} saved for ${args.building}`);
console.log(`   View at: https://expensas-garibaldi-407.vercel.app/edificio/${building.slug}`);
