#!/usr/bin/env node
/**
 * Price-list PDF -> CSV converter (macOS only).
 *
 * Renders each PDF page and OCRs it with Apple's Vision framework (via ocr.swift),
 * then reconstructs the product rows. We OCR rather than read the PDF text layer
 * because the manufacturer PDFs (notably C&S) embed subset fonts with broken
 * character maps -- digits like 2 and 3 are simply absent from the text. Vision
 * reads the rendered pixels, so the data comes back intact.
 *
 * Output is a CSV with headers the in-app importer already auto-maps:
 *   Item No, Name, Spec, MRP, Category, Image, Page, Raw Line
 * "Raw Line" is kept so you can eyeball/fix anything before importing.
 *
 * Product photos are also extracted (Luker has one per product; C&S/BCH one
 * illustration per family/page). They are written straight into Laravel's
 * storage/app/public/products/ and the CSV's Image column carries the /storage
 * URL, so the existing importer picks them up with no extra upload step.
 *
 *   node convert.mjs "<file.pdf>" [--pages 8,25,57] [--dpi 300] [--no-images] > out.csv
 */
import { execFileSync } from 'node:child_process';
import { statSync, existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const BIN = join(DIR, 'ocrbin');
const SRC = join(DIR, 'ocr.swift');
const IMG_BIN = join(DIR, 'imgbin');
const IMG_SRC = join(DIR, 'images.swift');

// ---- args ---------------------------------------------------------------
const argv = process.argv.slice(2);
const pdf = argv.find((a) => !a.startsWith('--'));
const getOpt = (k) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); if (a) return a.split('=')[1]; const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
const dpi = getOpt('dpi') || '300';
const pagesOpt = getOpt('pages');
const withImages = !argv.includes('--no-images');
// Where to drop extracted photos + the URL prefix the app serves them from.
const imagesDir = getOpt('images-dir') || join(DIR, '..', '..', 'storage', 'app', 'public', 'products');
const imageUrlBase = getOpt('image-url') || '/storage/products';
const scratchRoot = join(DIR, '.imgscratch');
const brandSlug = (getOpt('brand') || basename(pdf, '.pdf')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
if (!pdf) { console.error('usage: node convert.mjs "<file.pdf>" [--pages 1,2,3] [--dpi 300] [--no-images] > out.csv'); process.exit(1); }
if (!existsSync(pdf)) { console.error('no such file: ' + pdf); process.exit(1); }

// ---- ensure the helper binaries are built ------------------------------
function build(src, bin) {
    const stale = !existsSync(bin) || statSync(bin).mtimeMs < statSync(src).mtimeMs;
    if (stale) { console.error(`compiling ${basename(src)} ...`); execFileSync('swiftc', ['-O', src, '-o', bin], { stdio: ['ignore', 'ignore', 'inherit'] }); }
}
function ensureBin() { build(SRC, BIN); if (withImages) build(IMG_SRC, IMG_BIN); }

function ocrPage(page) {
    const json = execFileSync(BIN, [pdf, String(page), dpi], { maxBuffer: 64 * 1024 * 1024 }).toString();
    return JSON.parse(json);
}

function imagesPage(page, outDir) {
    const json = execFileSync(IMG_BIN, [pdf, String(page), '200', outDir], { maxBuffer: 32 * 1024 * 1024 }).toString();
    return JSON.parse(json);
}

function pageCount() {
    return Number(execFileSync(BIN, [pdf, 'count']).toString().trim()) || 0;
}

// ---- reconstruction -----------------------------------------------------
const PRICE_RE = /^[`₹]?\s*\d{2,7}$/;          // a bare MRP value
const NOISE = /^(go to contents|mrp|hsn|note|notes|conforms|range|features?|breaking|rating|reference|size|amps?|pole|frame|std|pkg|moq|electric|page|\d+\s*~\s*\d+)/i;

function isPrice(t) { return PRICE_RE.test(t.replace(/[, ]/g, '')) && Number(t.replace(/[^\d]/g, '')) >= 20; }

// A catalogue code: has letters AND digits, length >= 5, not a sentence and not a
// bare rating like "1000A" / "36kA" (those are specs, and the real code sits beside
// them — often containing parentheses such as WX310N3P1MDOA(S)).
const RATING_ONLY = /^\d+(\.\d+)?\s?(a|ka|v|kv|w|kw|hp|mm|va|kva|nm)$/i;
function looksLikeCode(t) {
    const s = t.replace(/[•*+]+$/, '').replace(/[.\-]+$/, '');
    if (s.length < 5 || s.length > 30) return false;
    if (/\s/.test(s)) return false;
    if (!/[A-Za-z]/.test(s) || !/\d/.test(s)) return false;
    if (RATING_ONLY.test(s)) return false;
    if (!/^[#]?[A-Za-z0-9.\-/()]+$/.test(s)) return false;
    return true;
}

function cleanCode(t) {
    let s = t.trim().replace(/\s+/g, '').replace(/[•]/g, '*');
    s = s.replace(/^#/, '');                                  // drop leading footnote hash
    s = s.replace(/^(?:(?:WH|WW|NW|CW|DL|RG|BK|SN)[.,]){1,}/i, ''); // colour codes glued onto a code
    // Normalise the C&S "-*" current-rating placeholder (OCR reads it as .+ -x .* etc.)
    s = s.replace(/[-.]*\s*[+*x•]+$/i, '-*');
    // O/I confusion only when wedged among digits (codes are uppercase + digits)
    s = s.replace(/(?<=\d)[OQ](?=\d)/g, '0').replace(/(?<=\d)I(?=\d)/g, '1');
    s = s.replace(/(?<=[A-Z])I(?=\d)/g, '1').replace(/(?<=\d)I(?=[A-Z])/g, '1');
    return s;
}

// Strip running headers / brand marks so the section name is the product family.
function cleanSection(s) {
    return s
        .replace(/^(?:go to contents.*?\*?|[1I]?c&s|bch|bhartia|electric|luker|dlp)\s*/gi, '')
        .replace(/\b(go to contents page|electric)\b/gi, '')
        .replace(/\s+/g, ' ').trim();
}

// First standalone rating like 125 / 160A / 630 in the spec text.
function ratingToken(spec) {
    const m = spec.match(/\b(\d{2,4})\s*A?\b/);
    return m ? m[1] + 'A' : '';
}

function reconstruct(data) {
    const items = data.items
        .map((it) => ({ t: String(it.t).trim(), x: it.x, y: it.y, w: it.w, h: it.h }))
        .filter((it) => it.t);
    if (!items.length) return { section: null, rows: [] };

    const heights = items.map((i) => i.h).sort((a, b) => a - b);
    const medianH = heights[Math.floor(heights.length / 2)] || 1;

    items.sort((a, b) => a.y - b.y || a.x - b.x);
    const tol = data.h * 0.006;
    const lines = [];
    let cur = [], curY = null;
    for (const it of items) {
        if (curY === null || Math.abs(it.y - curY) <= tol) { cur.push(it); curY = curY === null ? it.y : (curY + it.y) / 2; }
        else { lines.push(cur); cur = [it]; curY = it.y; }
    }
    if (cur.length) lines.push(cur);

    let section = null;
    const rows = [];
    for (const ln of lines) {
        ln.sort((a, b) => a.x - b.x);
        const text = ln.map((c) => c.t).join(' ').replace(/\s+/g, ' ').trim();
        const maxH = Math.max(...ln.map((c) => c.h));

        // Section heading: big text, few tokens, mostly words (no price), not noise.
        const codes = ln.filter((c) => looksLikeCode(c.t));
        const prices = ln.filter((c) => isPrice(c.t));
        if (maxH > medianH * 1.35 && ln.length <= 6 && !prices.length && !NOISE.test(text) && /[A-Za-z]{3,}/.test(text)) {
            const s = cleanSection(text);
            if (s) section = s;
            continue;
        }
        if (!codes.length) continue; // not a product row

        // Left-of-first-code descriptive tokens = rating/spec context.
        const firstCodeX = Math.min(...codes.map((c) => c.x));
        const spec = ln.filter((c) => c.x < firstCodeX && !isPrice(c.t) && !looksLikeCode(c.t))
            .map((c) => c.t).join(' ').replace(/\s+/g, ' ').trim();
        const rating = ratingToken(spec);

        // Pair each code with the nearest price to its right.
        const priceSorted = [...prices].sort((a, b) => a.x - b.x);
        for (const code of codes) {
            const p = priceSorted.find((pr) => pr.x > code.x + code.w * 0.3);
            let item = cleanCode(code.t);
            // Resolve the "-*" rating placeholder with the row's actual rating (C&S ordering rule).
            if (/-\*$/.test(item) && rating) item = item.replace(/-\*$/, '-' + rating);
            rows.push({
                item_no: item.slice(0, 190),
                name: ([section, spec].filter(Boolean).join(' — ').slice(0, 120) || item).slice(0, 190),
                spec: spec.slice(0, 200),
                mrp: p ? p.t.replace(/[^\d]/g, '') : '',
                category: (section || '').slice(0, 100),
                image: '',
                page: data.page,
                raw: text.slice(0, 200),
                _cx: (code.x + code.w / 2) / data.w,   // normalised code centre (for image pairing)
                _cy: (code.y + code.h / 2) / data.h,
            });
        }
    }
    return { section, rows };
}

// ---- image pairing ------------------------------------------------------
// Pair extracted page images to product rows and copy the chosen ones into the
// app's storage dir. Luker-style pages (many small photos) pair per product by
// 2D nearest; C&S/BCH pages (a few images) treat the largest as the family photo
// and assign it to every row on the page.
function pairImages(rows, img, copied) {
    if (!rows.length || !img || !img.images?.length) return;
    const W = img.W, H = img.H;
    // Normalise + filter out divider bars (extreme aspect) and tiny icons.
    const cand = img.images.map((im) => ({
        ...im, nx: (im.x + im.w / 2) / W, ny: (im.y + im.h / 2) / H,
        fw: im.w / W, fh: im.h / H, ar: im.w / Math.max(1, im.h), area: (im.w / W) * (im.h / H),
    })).filter((im) => im.file && im.fw > 0.02 && im.fh > 0.02 && im.ar < 6 && im.ar > 1 / 6);
    if (!cand.length) return;

    const assign = (row, im) => {
        let url = copied.get(im.file);
        if (!url) {
            const name = `${brandSlug}-p${row.page}-${basename(im.file, '.png')}.png`;
            try { copyFileSync(im.file, join(imagesDir, name)); url = `${imageUrlBase}/${name}`; copied.set(im.file, url); }
            catch { return; }
        }
        row.image = url;
    };

    if (cand.length >= 6) {
        // per-product: each row gets its nearest photo (if reasonably close)
        for (const row of rows) {
            let best = null, bd = 0.16;
            for (const im of cand) {
                const d = Math.hypot(im.nx - row._cx, im.ny - row._cy);
                if (d < bd) { bd = d; best = im; }
            }
            if (best) assign(row, best);
        }
    } else {
        // per-family: biggest image is the section illustration for the whole page
        const fam = cand.sort((a, b) => b.area - a.area)[0];
        for (const row of rows) assign(row, fam);
    }
}

// ---- csv ----------------------------------------------------------------
const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
function emitCsv(rows) {
    const head = ['Item No', 'Name', 'Spec', 'MRP', 'Category', 'Image', 'Page', 'Raw Line'];
    process.stdout.write(head.map(q).join(',') + '\n');
    for (const r of rows) process.stdout.write([r.item_no, r.name, r.spec, r.mrp, r.category, r.image, r.page, r.raw].map(q).join(',') + '\n');
}

// ---- run ----------------------------------------------------------------
ensureBin();
let pages;
if (pagesOpt) pages = pagesOpt.split(',').map((s) => Number(s.trim())).filter(Boolean);
else { console.error('counting pages ...'); const n = pageCount(); pages = Array.from({ length: n }, (_, i) => i + 1); }

console.error(`OCR ${basename(pdf)} : ${pages.length} page(s) @ ${dpi}dpi${withImages ? ' + images' : ''}`);
if (withImages) mkdirSync(imagesDir, { recursive: true });
const copied = new Map();      // source temp png -> final /storage url (de-dup copies)
const all = [];
let done = 0, withImg = 0;
for (const pg of pages) {
    try {
        const data = ocrPage(pg);
        const { rows } = reconstruct(data);
        if (withImages && rows.length) {
            const scratch = join(scratchRoot, `p${pg}`);
            mkdirSync(scratch, { recursive: true });
            try { pairImages(rows, imagesPage(pg, scratch), copied); }
            catch (e) { console.error(`  page ${pg} images: ${String(e.message || e).slice(0, 60)}`); }
            rmSync(scratch, { recursive: true, force: true });
        }
        withImg += rows.filter((r) => r.image).length;
        all.push(...rows);
    } catch (e) { console.error(`  page ${pg}: ${String(e.message || e).slice(0, 80)}`); }
    if (++done % 5 === 0 || done === pages.length) console.error(`  ${done}/${pages.length} pages, ${all.length} rows, ${withImg} with image`);
}
rmSync(scratchRoot, { recursive: true, force: true });
// Drop exact (item_no,mrp,page) repeats, then guarantee item_no is globally unique
// so the importer's upsert (brand_id,item_no) never silently overwrites a real product.
const seen = new Set();
const rows = all.filter((r) => { const k = `${r.item_no}|${r.mrp}|${r.page}`; if (seen.has(k)) return false; seen.add(k); return true; });
const used = new Map();
for (const r of rows) {
    let id = r.item_no, n = used.get(id) || 0;
    if (n) { const suffix = r.spec ? '-' + r.spec.replace(/[^A-Za-z0-9]/g, '').slice(0, 6) : ''; id = `${r.item_no}${suffix}#${n + 1}`; }
    used.set(r.item_no, n + 1);
    r.item_no = id;
}
emitCsv(rows);
console.error(`done: ${rows.length} rows`);
