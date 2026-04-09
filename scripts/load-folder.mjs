#!/usr/bin/env node

import { basename } from "node:path";
import {
  createAnthropicClient,
  ensureBuilding,
  formatCurrency,
  generateSlug,
  listPdfFiles,
  parsePdfFile,
  saveLiquidacion,
} from "./lib/load-pdf-core.mjs";

function parseArgs(argv = process.argv.slice(2)) {
  const get = (flag) => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };

  return {
    dir: get("--dir"),
    building: get("--building"),
    address: get("--address"),
    admin: get("--admin"),
    cuit: get("--cuit"),
    dryRun: argv.includes("--dry-run"),
  };
}

function printUsage() {
  console.error(
    "Usage: npm run load:folder -- --dir <folder> --building <name> --address <addr> [--admin <name>] [--cuit <cuit>] [--dry-run]"
  );
}

const args = parseArgs();

if (!args.dir || !args.building || !args.address) {
  printUsage();
  process.exit(1);
}

const pdfFiles = listPdfFiles(args.dir);

if (pdfFiles.length === 0) {
  console.error(`No encontré PDFs en ${args.dir}`);
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

console.log(`\nImporting ${pdfFiles.length} PDFs from ${args.dir}`);

let savedCount = 0;
for (const [index, pdfPath] of pdfFiles.entries()) {
  console.log(`\n[${index + 1}/${pdfFiles.length}] ${basename(pdfPath)}`);
  const result = await parsePdfFile(client, pdfPath);

  console.log(
    `  ${result.parsed.label} (${result.parsed.month}) · ${formatCurrency(result.parsed.total)} · ${result.parsed.items.length} items · ${result.sizeKb.toFixed(1)} KB`
  );

  if (args.dryRun) {
    console.log("  dry-run: salteando guardado");
    continue;
  }

  await saveLiquidacion(query, building.id, result.parsed);
  savedCount += 1;
  console.log("  guardado");
}

if (args.dryRun) {
  console.log(`\nDry run completo: ${pdfFiles.length} PDFs parseados, 0 guardados.`);
  process.exit(0);
}

console.log(`\n✅ Done! ${savedCount} liquidaciones guardadas para ${args.building}`);
console.log(`   View at: https://expensas-garibaldi-407.vercel.app/edificio/${building.slug}`);
