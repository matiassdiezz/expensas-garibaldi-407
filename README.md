This is a [Next.js](https://nextjs.org) project for loading, parsing, and comparing building expense PDFs.

## Importing PDFs

The repo now supports two Node-native import flows without depending on `tsx`:

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

If you want the old Claude-reviewed workflow, use a two-step pipeline:

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

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
