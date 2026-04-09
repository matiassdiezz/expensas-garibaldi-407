#!/usr/bin/env node

import { basename, join, resolve } from "node:path";
import {
  buildJsonPayload,
  createAnthropicClient,
  generateSlug,
  listPdfFiles,
  parsePdfFile,
  writeJsonFile,
} from "./lib/load-pdf-core.mjs";

function parseArgs(argv = process.argv.slice(2)) {
  const get = (flag) => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };

  return {
    dir: get("--dir"),
    out: get("--out"),
    building: get("--building"),
    address: get("--address"),
    admin: get("--admin"),
    cuit: get("--cuit"),
  };
}

function printUsage() {
  console.error(
    "Usage: npm run extract:json -- --dir <folder> --building <name> --address <addr> [--admin <name>] [--cuit <cuit>] [--out <file>]"
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
const outPath = resolve(args.out ?? join(args.dir, "data.json"));

console.log(`Extrayendo ${pdfFiles.length} PDFs para ${args.building} (${slug})`);

const liquidaciones = [];
for (const [index, pdfPath] of pdfFiles.entries()) {
  console.log(`\n[${index + 1}/${pdfFiles.length}] ${basename(pdfPath)}`);
  const result = await parsePdfFile(client, pdfPath);
  liquidaciones.push({
    ...result.parsed,
    sourcePdf: basename(pdfPath),
  });

  console.log(
    `  ${result.parsed.label} (${result.parsed.month}) · ${result.parsed.items.length} items · ${result.sizeKb.toFixed(1)} KB`
  );
}

const payload = buildJsonPayload(
  {
    name: args.building,
    address: args.address,
    adminCompany: args.admin,
    cuit: args.cuit,
  },
  liquidaciones
);

writeJsonFile(outPath, payload);

console.log(`\n✅ JSON generado: ${outPath}`);
console.log("   Revisalo antes de sembrarlo en la base.");
