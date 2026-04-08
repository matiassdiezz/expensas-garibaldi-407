/**
 * Extract text from a PDF using pdfjs-dist (client-side).
 * Groups text items by Y coordinate into readable lines.
 */

export interface PdfLine {
  text: string;
  y: number;
  pageNum: number;
}

export interface PdfExtraction {
  pages: PdfLine[][];
  allLines: string[];
  rawText: string;
}

const Y_TOLERANCE = 3; // px — group text items on the same visual line
const WORD_GAP_PX = 20; // gap threshold to insert tab vs space
const APPROX_CHAR_WIDTH = 4; // rough px per character for gap estimation

export async function extractText(
  arrayBuffer: ArrayBuffer
): Promise<PdfExtraction> {
  const pdfjsLib = await import("pdfjs-dist");

  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: PdfLine[][] = [];
  const allLines: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // Group text items by Y coordinate (within 3px tolerance)
    const lineMap = new Map<number, Array<{ str: string; x: number }>>();

    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;

      const tx = item.transform;
      const x = tx[4];
      const y = Math.round(tx[5]); // round Y to group nearby items

      let matchedY: number | null = null;
      for (const existingY of lineMap.keys()) {
        if (Math.abs(existingY - y) <= Y_TOLERANCE) {
          matchedY = existingY;
          break;
        }
      }

      const targetY = matchedY ?? y;
      if (!lineMap.has(targetY)) lineMap.set(targetY, []);
      lineMap.get(targetY)!.push({ str: item.str, x });
    }

    // Sort lines by Y descending (PDF Y-axis: bottom=0, top=max)
    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
    const pageLines: PdfLine[] = [];

    for (const y of sortedYs) {
      const items = lineMap.get(y)!;
      // Sort items left to right
      items.sort((a, b) => a.x - b.x);

      // Join with appropriate spacing
      let text = "";
      for (let j = 0; j < items.length; j++) {
        if (j > 0) {
          const gap = items[j].x - (items[j - 1].x + items[j - 1].str.length * APPROX_CHAR_WIDTH);
          text += gap > WORD_GAP_PX ? "    " : " ";
        }
        text += items[j].str;
      }

      text = text.trim();
      if (text) {
        pageLines.push({ text, y, pageNum: i });
        allLines.push(text);
      }
    }

    pages.push(pageLines);
  }

  return {
    pages,
    allLines,
    rawText: allLines.join("\n"),
  };
}
