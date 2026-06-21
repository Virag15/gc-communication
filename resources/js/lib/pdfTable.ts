/**
 * Best-effort table extraction from a text-based PDF (e.g. a price list exported
 * from Excel). Reconstructs rows by clustering text on the Y axis and columns by
 * aligning each line's cells to the detected header's X positions.
 *
 * Works for text PDFs; scanned/image PDFs return nothing (need OCR -> use Excel/CSV).
 * The importer's mapping + preview step is the safety net for imperfect extraction.
 */
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface Cell { x: number; end: number; str: string; }

const HEADER_KW = /(sku|code|item|part|article|model|cat\.?\s*no|description|name|product|particular|spec|rating|rated|mrp|rate|price|list|unit|hsn|category|series|pack|amp|qty)/i;

export async function parsePdfTable(file: File): Promise<{ headers: string[]; rows: string[][] }> {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;

    const lines: Cell[][] = [];

    for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const tc = await page.getTextContent();
        const items = (tc.items as Array<{ str?: string; transform: number[]; width?: number }>)
            .map((it) => ({ str: String(it.str ?? ''), x: it.transform[4], y: it.transform[5], w: it.width ?? 0 }))
            .filter((it) => it.str.trim() !== '');
        if (!items.length) continue;

        // Cluster items into visual lines by Y (PDF Y increases upward -> top first).
        items.sort((a, b) => b.y - a.y || a.x - b.x);
        const groups: (typeof items)[] = [];
        let cur: typeof items = [];
        let curY = items[0].y;
        for (const it of items) {
            if (Math.abs(it.y - curY) > 3) { if (cur.length) groups.push(cur); cur = []; curY = it.y; }
            cur.push(it);
        }
        if (cur.length) groups.push(cur);

        // Merge horizontally-adjacent fragments into cells (gap < 8 units = same cell).
        for (const g of groups) {
            g.sort((a, b) => a.x - b.x);
            const cells: Cell[] = [];
            for (const it of g) {
                const last = cells[cells.length - 1];
                if (last && it.x - last.end < 8) {
                    last.str += (it.x - last.end > 1 ? ' ' : '') + it.str;
                    last.end = it.x + it.w;
                } else {
                    cells.push({ x: it.x, end: it.x + it.w, str: it.str });
                }
            }
            const clean = cells.map((c) => ({ ...c, str: c.str.trim() })).filter((c) => c.str);
            if (clean.length) lines.push(clean);
        }
    }

    if (!lines.length) return { headers: [], rows: [] };

    // Header = line with the most keyword hits (tie-break: most cells).
    let headerIdx = 0;
    let best = -1;
    lines.forEach((ln, i) => {
        if (ln.length < 2) return;
        const score = ln.filter((c) => HEADER_KW.test(c.str)).length * 100 + ln.length;
        if (score > best) { best = score; headerIdx = i; }
    });

    const header = lines[headerIdx];
    const anchors = header.map((c) => c.x);
    const headers = header.map((c) => c.str);
    const headerKey = headers.join('|').toLowerCase();

    const colFor = (x: number) => {
        let idx = 0;
        for (let i = 0; i < anchors.length; i++) if (x >= anchors[i] - 12) idx = i;
        return idx;
    };

    const rows: string[][] = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
        const ln = lines[i];
        if (ln.map((c) => c.str).join('|').toLowerCase() === headerKey) continue; // repeated header
        const cells = new Array(anchors.length).fill('');
        for (const c of ln) {
            const col = colFor(c.x);
            cells[col] = cells[col] ? `${cells[col]} ${c.str}` : c.str;
        }
        if (cells.some((v) => v.trim())) rows.push(cells.map((v) => v.trim()));
    }

    return { headers, rows };
}
