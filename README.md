# Expensas Dashboard

Next.js app que carga, parsea y compara liquidaciones de expensas de varios edificios.

## Edificios trackeados

| Edificio | UF de interés | Período disponible | PDFs |
|---|---|---|---|
| Garibaldi 407/411 (San Isidro) | UF 26 (1°A, 6.40%) | Mar 2025 – May 2026 | `pdfs/garibaldi-407/` (parcial) |
| Av. Santa Fe 410 (Acassuso) | — | Oct 2025 – Mar 2026 | `pdfs/av-santa-fe-410/` |
| Alfaro 180 (San Isidro) | — | Oct 2025 – Mar 2026 | `pdfs/alfaro-180/` |

Garibaldi 407 está modelado a mano en `src/lib/data.ts` + `src/lib/liquidaciones.json` (no usa pipeline de DB porque arrancó antes que el dynamic data flow).

## Agregar una liquidación nueva (Garibaldi 407)

1. Guardar el PDF original en `pdfs/garibaldi-407/YYYY-MM.pdf` (donde `YYYY-MM` = mes de vencimiento, no el período).
2. Agregar entrada al final del array de `src/lib/data.ts` con `month`, `label`, `total`, `expensasA` y los `items` desglosados.
3. Agregar entrada equivalente al array `liquidaciones` en `src/lib/liquidaciones.json` con `cashFlow`, `prorrateo`, `egresos.secciones` y `aviso`.
4. Verificar consistencia:
   ```bash
   node audit.js
   ```
   El audit chequea: estructura, sumas por sección, encadenamiento de saldos (`saldoFinal[N] === saldoAnterior[N+1]`), suma de items vs total, formato de fechas, items vacíos/negativos.

## Importar PDFs (otros edificios — pipeline DB-backed)

### Single PDF

```bash
npm run load:pdf -- \
  --pdf ./pdfs/alfaro-180/331-55-Octubre-2025-Planilla.pdf \
  --building "Alfaro 180" \
  --address "Alfaro 180, San Isidro" \
  --admin "Administración Salgado"
```

### Folder of PDFs for one building

```bash
npm run load:folder -- \
  --dir ./pdfs/alfaro-180 \
  --building "Alfaro 180" \
  --address "Alfaro 180, San Isidro" \
  --admin "Administración Salgado"
```

Optional flags:

- `--cuit <valor>`
- `--dry-run` to parse without saving in Neon

Both scripts auto-load `.env.local` from the repo root. They require:

- `DATABASE_URL`
- `ANTHROPIC_API_KEY`

## JSON-first flow

For the Claude-reviewed workflow, use a two-step pipeline:

### 1. Extract a folder of PDFs to `data.json`

```bash
npm run extract:json -- \
  --dir ./pdfs/av-santa-fe-410 \
  --building "Av. Santa Fe 410" \
  --address "Av. Santa Fe 410, Acassuso, Buenos Aires" \
  --admin "P. Tapia"
```

This writes `data.json` inside that folder by default.

### 2. Seed from the reviewed JSON

```bash
npm run seed:json -- --json ./pdfs/av-santa-fe-410/data.json
```

Use `--dry-run` on `seed:json` to validate what would be imported without touching Neon.

## Dev

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Deploy en Vercel (auto-deploy desde `main`).
