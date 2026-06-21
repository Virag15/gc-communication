/**
 * Estimate / Bill-of-Materials PDF generator.
 *
 * Three templates (Classic / Bold / Studio), fully dealer-brandable. Uses an
 * embedded Unicode font (Inter / PJS in public/fonts) so the Rupee glyph (₹)
 * renders correctly. Adapted for GC Communication from a reference layout;
 * all third-party branding removed - dealer details come from Estimate Settings.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { computeTotals, inrWords, type EstimateLine } from './estimateMoney';

export interface EstCustomer {
    name: string;
    phone?: string | null;
    address?: string | null;
    gstin?: string | null;
    refBy?: string | null;
    company?: string | null;
}

export interface EstDealer {
    addr1: string;
    addr2: string;
    phone: string;
    email: string;
    website: string;
    gstin: string;
}

export interface EstBrand {
    name: string;
    template: 'classic' | 'bold' | 'studio';
    accent: string;
    paper: string;
    font: 'inter' | 'pjs';
    footer: string;
    side: string;
    wordmark: string;
    preparedBy: string;
    docTitle: string;
    note: string;
    terms: string;
    watermark: string;
    validDays: number;
    logosPos: 'top' | 'bottom';
    photos: boolean;
    showPrices: boolean;
    showScheme: boolean;
    gstPct: number;
    logo?: string | null;
    dealerLogos?: string[];
    dealer: EstDealer;
}

export interface EstInput {
    cust: EstCustomer;
    items: EstimateLine[];
    brand: EstBrand;
    special?: number;
    deliveryFee?: number;
    express?: boolean;
    meta?: { no?: string; date?: string };
    out?: 'save' | 'blob';
}

const FONT_FILES: Record<string, [string, string]> = {
    inter: ['Inter-Regular.ttf', 'Inter-Bold.ttf'],
    pjs: ['PJS-Regular.ttf', 'PJS-Bold.ttf'],
};

const hexToRgb = (hex: string): [number, number, number] => {
    const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return [105, 110, 116];
    const v = parseInt(m[1], 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

const fetchB64 = async (url: string): Promise<string> => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`fetch ${url}: ${r.status}`);
    const b = new Uint8Array(await r.arrayBuffer());
    let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000) as unknown as number[]);
    return btoa(s);
};

interface LoadedImage { data: string; w: number; h: number }

/** Load an image (same-origin) to a PNG dataURL + natural dims, via canvas. */
const loadImage = (url: string): Promise<LoadedImage | null> =>
    new Promise((resolve) => {
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = () => {
            try {
                const c = document.createElement('canvas');
                c.width = im.naturalWidth;
                c.height = im.naturalHeight;
                const ctx = c.getContext('2d');
                if (!ctx) return resolve(null);
                ctx.drawImage(im, 0, 0);
                resolve({ data: c.toDataURL('image/png'), w: im.naturalWidth, h: im.naturalHeight });
            } catch {
                resolve(null);
            }
        };
        im.onerror = () => resolve(null);
        im.src = url;
    });

const drawRich = (doc: jsPDF, text: string, x: number, y: number, width: number, opts: { size?: number; lh?: number; color?: [number, number, number] } = {}): number => {
    const { size = 8, lh = 4.2, color = [26, 28, 31] } = opts;
    doc.setFontSize(size).setTextColor(...color);
    let cx = x;
    let cy = y;
    String(text).split('**').forEach((seg, i) => {
        doc.setFont('DOC', i % 2 ? 'bold' : 'normal');
        seg.split(/(\n)/).forEach((chunk) => {
            if (chunk === '\n') { cx = x; cy += lh; return; }
            chunk.split(/(\s+)/).forEach((tok) => {
                if (!tok) return;
                const w = doc.getTextWidth(tok);
                if (cx + w > x + width && tok.trim()) { cx = x; cy += lh; }
                if (tok.trim() || cx > x) { doc.text(tok, cx, cy); cx += w; }
            });
        });
    });
    return cy;
};

export async function generateEstimatePdf(input: EstInput): Promise<{ no: string; filename: string; grand: number; blob?: Blob }> {
    const { cust, items, brand, out = 'save' } = input;
    const showImg = brand.photos !== false && items.some((i) => i.image);
    const [fontRegFile, fontBoldFile] = FONT_FILES[brand.font] || FONT_FILES.inter;

    const [fontN, fontB, mark, thumbs, dealerLogos] = await Promise.all([
        fetchB64(`/fonts/${fontRegFile}`),
        fetchB64(`/fonts/${fontBoldFile}`),
        brand.logo ? loadImage(brand.logo) : Promise.resolve(null),
        showImg ? Promise.all(items.map((it) => (it.image ? loadImage(it.image) : Promise.resolve(null)))) : Promise.resolve([] as (LoadedImage | null)[]),
        Promise.all((brand.dealerLogos || []).map((u) => loadImage(u))),
    ]);
    const brandLogos = dealerLogos.filter(Boolean) as LoadedImage[];

    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    doc.addFileToVFS(fontRegFile, fontN);
    doc.addFont(fontRegFile, 'DOC', 'normal');
    doc.addFileToVFS(fontBoldFile, fontB);
    doc.addFont(fontBoldFile, 'DOC', 'bold');
    doc.setFont('DOC', 'normal');

    const W = 210, H = 297, M = 14;
    const INK: [number, number, number] = [26, 28, 31];
    const GRAY: [number, number, number] = [105, 110, 116];
    const PAPER = hexToRgb(brand.paper);
    const HAIR = PAPER.map((c) => Math.max(0, c - 42)) as [number, number, number];
    const ACCENT = hexToRgb(brand.accent);
    const FOOT = hexToRgb(brand.footer);
    const SIDE = hexToRgb(brand.side);
    const WORD = hexToRgb(brand.wordmark || '#1A1C1F');
    const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

    const no = input.meta?.no || `BOM-${String(Date.now()).slice(-6)}`;
    const d = input.meta?.date ? new Date(input.meta.date) : new Date();
    const today = [String(d.getDate()).padStart(2, '0'), String(d.getMonth() + 1).padStart(2, '0'), d.getFullYear()].join('.');
    const validDays = brand.validDays || 7;
    const note = brand.note || '';
    const dealer = brand.dealer;
    const docTitle = (brand.docTitle || 'Bill of Materials').trim() || 'Bill of Materials';
    const showPrices = brand.showPrices !== false;
    const preparedBy = brand.preparedBy || '';

    const T = computeTotals(items, { showScheme: brand.showScheme, gstPct: brand.gstPct, special: input.special, deliveryFee: input.deliveryFee });

    const paper = () => {
        doc.setFillColor(...PAPER).rect(0, 0, W, H, 'F');
        if (brand.watermark) {
            doc.saveGraphicsState();
            // @ts-expect-error - GState typing
            doc.setGState(new doc.GState({ opacity: 0.07 }));
            doc.setFont('DOC', 'bold').setFontSize(86).setTextColor(...INK);
            doc.text(brand.watermark.toUpperCase(), W / 2, H / 2 + 30, { angle: 45, align: 'center' });
            doc.restoreGraphicsState();
        }
    };
    paper();

    const dealerLines = [`${preparedBy ? preparedBy + ' - ' : ''}${brand.name}`, dealer.addr1, `${dealer.addr2}${dealer.phone ? ' · ' + dealer.phone : ''}`].filter(Boolean);
    const custLines = [
        cust.name,
        cust.phone,
        ...(cust.address ? doc.splitTextToSize(cust.address, 80) : []),
        cust.gstin ? `GSTIN ${cust.gstin}` : null,
        cust.refBy ? `Ref. by - ${cust.refBy}` : null,
    ].filter(Boolean) as string[];

    const billRows: [string, string][] = !showPrices ? [] : ([
        ['Item total', inr(T.itemTotal)],
        T.schemeOff > 0 ? [`Volume scheme (${T.schemePct}%)`, '-' + inr(T.schemeOff)] : null,
        T.special > 0 ? ['Special discount', '-' + inr(T.special)] : null,
        ['Delivery' + (input.express ? ' (express)' : ''), T.deliveryFee === 0 ? 'FREE' : inr(T.deliveryFee)],
    ].filter(Boolean) as [string, string][]);

    const itemsTable = ({ startY, bottom, headFill, big = false }: { startY: number; bottom: number; headFill?: [number, number, number] | null; big?: boolean }) => {
        type Col = { h: string; w: number | 'auto'; img?: boolean; gray?: boolean; right?: boolean };
        const cols: Col[] = [{ h: 'Qty', w: 11 }];
        if (showImg) cols.push({ h: '', w: big ? 17 : 13, img: true });
        cols.push({ h: 'Item no', w: 22, gray: true });
        cols.push({ h: 'Description', w: 'auto' });
        if (showPrices) {
            cols.push({ h: 'Unit price', w: 25, right: true, gray: true });
            cols.push({ h: 'Amount', w: 27, right: true });
        }
        const imgCol = cols.findIndex((c) => c.img);
        const columnStyles: Record<number, Record<string, unknown>> = {};
        cols.forEach((c, i) => {
            columnStyles[i] = {
                ...(c.w !== 'auto' ? { cellWidth: c.w } : { cellWidth: 'auto' }),
                ...(c.right ? { halign: 'right' } : {}),
                ...(c.gray ? { textColor: GRAY } : {}),
                ...(c.img ? { minCellHeight: big ? 16 : 12.5 } : {}),
            };
        });
        autoTable(doc, {
            startY,
            margin: { left: M, right: M, top: 14, bottom },
            head: [cols.map((c) => c.h)],
            body: items.map((it) => cols.map((c) => {
                if (c.img) return '';
                switch (c.h) {
                    case 'Qty': return String(it.qty);
                    case 'Item no': return (it.itemNo || '').toUpperCase();
                    case 'Description': return `${it.name}${it.spec ? '\n' + it.spec : ''}`;
                    case 'Unit price': return inr(it.unitPrice);
                    default: return inr(it.unitPrice * it.qty);
                }
            })),
            theme: 'plain',
            styles: { font: 'DOC', fontSize: 8.5, textColor: INK, cellPadding: { top: 2.2, bottom: 2.2, left: headFill ? 1.5 : 0, right: 2 }, valign: 'middle' },
            headStyles: headFill
                ? { font: 'DOC', fontStyle: 'bold', fontSize: 8, textColor: INK, fillColor: headFill, lineWidth: 0 }
                : { font: 'DOC', fontStyle: 'bold', fontSize: 8.5, textColor: INK, lineWidth: { bottom: 0.35 }, lineColor: INK },
            bodyStyles: { lineWidth: { bottom: 0.18 }, lineColor: HAIR },
            columnStyles,
            willDrawPage: (data) => { if (data.pageNumber > 1) paper(); },
            didParseCell: (data) => {
                if (data.section === 'head' && cols[data.column.index]?.right) data.cell.styles.halign = 'right';
            },
            didDrawCell: (data) => {
                if (imgCol < 0 || data.section !== 'body' || data.column.index !== imgCol) return;
                const t = thumbs[data.row.index];
                const s = big ? 12 : 9;
                const ix = data.cell.x;
                const iy = data.cell.y + (data.cell.height - s) / 2;
                if (t) doc.addImage(t.data, 'PNG', ix, iy, s, s);
                else doc.setFillColor(225, 225, 221).rect(ix, iy, s, s, 'F');
            },
        });
        // @ts-expect-error - lastAutoTable is augmented by the plugin
        return doc.lastAutoTable.finalY as number;
    };

    const totalsBlock = (startY: number, bottomGuard: number) => {
        let y = startY;
        const nRows = 1 + billRows.length + (T.gstPct ? 2 : 0);
        const blockH = (nRows + 1) * 7.5 + 14;
        if (y + blockH > bottomGuard) { doc.addPage(); paper(); y = 30; }
        const tx = 118;
        const row = (label: string, val: string) => {
            doc.setFont('DOC', 'normal').setFontSize(8.5).setTextColor(...GRAY);
            doc.text(label, tx, y);
            doc.setTextColor(...INK).text(val, W - M, y, { align: 'right' });
            doc.setDrawColor(...HAIR).setLineWidth(0.18).line(tx, y + 2.6, W - M, y + 2.6);
            y += 7.5;
        };
        row('Total items', `${T.lineCount} · ${T.totalPcs} pcs`);
        for (const [l, v] of billRows) row(l, v);
        if (showPrices && T.gstPct) row('Subtotal', inr(T.subtotal));
        if (showPrices && T.gstPct) row(`GST (${T.gstPct}%)`, inr(T.gstAmt));
        if (showPrices) {
            doc.setFont('DOC', 'bold').setFontSize(10).setTextColor(...INK);
            doc.text(T.gstPct ? 'Grand total' : 'Total', tx, y);
            doc.text(inr(T.grand), W - M, y, { align: 'right' });
            doc.setDrawColor(...INK).setLineWidth(0.35).line(tx, y + 3, W - M, y + 3);
        } else {
            doc.setFont('DOC', 'bold').setFontSize(9).setTextColor(...INK);
            doc.text('Material list - prices on request', tx, y);
            doc.setDrawColor(...INK).setLineWidth(0.35).line(tx, y + 3, W - M, y + 3);
        }
        return y;
    };

    const terms0 = (brand.terms || '').trim();
    const payBlock = (x: number, y: number, maxW: number, limit: number) => {
        if (!terms0) return y;
        let cy = y;
        if (y + 16 > limit) { doc.addPage(); paper(); cy = 30; }
        doc.setFont('DOC', 'bold').setFontSize(7).setTextColor(...GRAY).setCharSpace(0.5);
        doc.text('TERMS & CONDITIONS', x, cy + 3);
        doc.setCharSpace(0);
        return drawRich(doc, terms0, x, cy + 7.4, maxW, { size: 7, lh: 3.4, color: GRAY });
    };

    const placeMark = (x: number, y: number, maxW: number, maxH: number) => {
        if (!mark) return;
        const w = Math.min(maxW, (mark.w / mark.h) * maxH);
        doc.addImage(mark.data, 'PNG', x, y, w, maxH);
    };

    /* ---------------- CLASSIC ---------------- */
    const renderClassic = () => {
        const logosTop = brand.logosPos !== 'bottom';
        doc.setFont('DOC', 'bold').setFontSize(brand.name.length > 14 ? 20 : 25).setTextColor(...WORD).text(brand.name, M, 13.5);
        placeMark(W - M - 40, 6, 40, 16);

        const logoStrip = (ly: number) => {
            if (!brandLogos.length) return;
            doc.setFont('DOC', 'bold').setFontSize(6.5).setTextColor(...GRAY).setCharSpace(0.5);
            doc.text('AUTHORIZED DEALER FOR', M, ly);
            doc.setCharSpace(0);
            let bx = M;
            for (const b of brandLogos) {
                const dw = (b.w / b.h) * 9;
                doc.addImage(b.data, 'PNG', bx, ly + 2.5, dw, 9);
                bx += dw + 10;
            }
        };
        if (logosTop) logoStrip(25);

        const infoY = logosTop && brandLogos.length ? 45 : 31;
        doc.setFont('DOC', 'bold').setFontSize(9).setTextColor(...INK);
        doc.text('Customer Information', M, infoY).text('Dealer Information', 112, infoY);
        doc.setFont('DOC', 'normal').setFontSize(8.5).setTextColor(...GRAY);
        doc.text(custLines, M, infoY + 6);
        doc.text(dealerLines, 112, infoY + 6);

        const tTop = infoY + 6 + Math.max(custLines.length, 3) * 4.3 + 5;
        doc.setDrawColor(...HAIR).setLineWidth(0.3).line(M, tTop, W - M, tTop);
        doc.setFont('DOC', 'bold').setFontSize(docTitle.length > 22 ? 13 : 17).setTextColor(...INK).text(docTitle, M, tTop + 9.5);
        doc.setFont('DOC', 'normal').setFontSize(10).setTextColor(...GRAY);
        doc.text(no, 132, tTop + 9.5, { align: 'center' });
        doc.text(today, W - M, tTop + 9.5, { align: 'right' });
        doc.line(M, tTop + 14, W - M, tTop + 14);

        const fin = itemsTable({ startY: tTop + 19, bottom: logosTop ? 24 : 40 });
        let y = totalsBlock(fin + 8, H - (logosTop ? 24 : 42));
        payBlock(M, fin + 13, 98, H - (logosTop ? 26 : 42));
        if (!logosTop) logoStrip(H - 38);
        if (note) y = drawRich(doc, note, 118, y + 9.5, W - M - 118, { size: 8 });
        doc.setFont('DOC', 'normal').setFontSize(7.5).setTextColor(...GRAY);
        doc.text(`Valid ${validDays} days from the date above.`, 118, y + 4.5);
        if (preparedBy) doc.text(`Prepared by ${preparedBy}.`, 118, y + 8.5);

        footer();
    };

    const footer = () => {
        const pages = doc.getNumberOfPages();
        for (let i = 1; i <= pages; i++) {
            doc.setPage(i);
            doc.setDrawColor(...INK).setLineWidth(0.4).line(M, H - 21, W - M, H - 21);
            doc.setFont('DOC', 'normal').setFontSize(7.5).setTextColor(...FOOT);
            doc.text([dealer.email, dealer.website].filter(Boolean), M, H - 15.5);
            doc.text([dealer.addr1, dealer.addr2].filter(Boolean), 72, H - 15.5);
            if (dealer.gstin) doc.text(['GSTIN', dealer.gstin], 176, H - 15.5);
            doc.setFontSize(6.5).setTextColor(...SIDE).text(`${brand.name}`, 8, H - 10, { angle: 90 });
        }
    };

    /* ---------------- BOLD ---------------- */
    const renderBold = () => {
        const onAccent: [number, number, number] = [20, 22, 24];
        doc.setFillColor(...ACCENT).rect(0, 0, W, 52, 'F');
        const bt = docTitle.length > 14 ? docTitle : docTitle.toUpperCase();
        doc.setFont('DOC', 'bold').setFontSize(bt.length > 18 ? 15 : bt.length > 8 ? 22 : 34).setTextColor(...WORD).text(bt, M, 20);
        placeMark(W - M - 36, 7, 36, 14);
        const cap = (t: string, x: number, yy: number) => {
            doc.setFont('DOC', 'bold').setFontSize(6.5).setTextColor(...onAccent).setCharSpace(0.4);
            doc.text(t, x, yy);
            doc.setCharSpace(0);
        };
        cap('(DATE)', M, 30); cap('(VALID FOR)', M, 41); cap('(BILLED TO)', 74, 30); cap('(FROM)', 74, 41);
        doc.setFont('DOC', 'normal').setFontSize(8).setTextColor(...onAccent);
        doc.text(today, M, 34.5).text(`${validDays} days`, M, 45.5);
        doc.text(`${cust.name}${cust.phone ? ' · ' + cust.phone : ''}`, 74, 34.5);
        if (cust.refBy) doc.setFontSize(7).text(`Ref. by - ${cust.refBy}`, 74, 37.8).setFontSize(8);
        doc.text(dealerLines[0], 74, 45.5);

        const fin = itemsTable({ startY: 60, bottom: 48, headFill: PAPER.map((c) => Math.max(0, c - 14)) as [number, number, number] });
        const y = totalsBlock(fin + 8, H - 52);
        const ny = note ? drawRich(doc, note, M, y + 2, 92, { size: 8 }) : y;
        payBlock(M, ny + 6, 92, H - 44);

        const pages = doc.getNumberOfPages();
        for (let i = 1; i <= pages; i++) {
            doc.setPage(i);
            doc.setFillColor(60, 64, 67).rect(0, H - 40, W, 26, 'F');
            doc.setFont('DOC', 'bold').setFontSize(6.5).setTextColor(255, 255, 255).setCharSpace(0.4);
            doc.text('(DEALER)', M, H - 33).text('(PREPARED BY)', 150, H - 33);
            doc.setCharSpace(0);
            doc.setFont('DOC', 'normal').setFontSize(7.5);
            doc.text([`${dealer.addr1}, ${dealer.addr2}`, dealer.gstin ? 'GSTIN ' + dealer.gstin : ''].filter(Boolean), M, H - 28);
            if (preparedBy) doc.text(preparedBy, 150, H - 28);
            doc.setFillColor(...ACCENT).rect(0, H - 14, W, 14, 'F');
            doc.setFont('DOC', 'bold').setFontSize(9).setTextColor(...onAccent).text(brand.name, M, H - 5.5);
            let lx = W - M;
            for (const b of [...brandLogos].reverse()) {
                const dw = (b.w / b.h) * 7;
                lx -= dw;
                doc.setFillColor(255, 255, 255).rect(lx - 1.5, H - 12, dw + 3, 10, 'F');
                doc.addImage(b.data, 'PNG', lx, H - 10.5, dw, 7);
                lx -= 7.5;
            }
        }
    };

    /* ---------------- STUDIO ---------------- */
    const renderStudio = () => {
        placeMark(M, 8, 38, 16);
        const metaRows: [string, string][] = ([
            ['TO', cust.name.toUpperCase()],
            cust.refBy ? ['REF. BY', cust.refBy.toUpperCase()] : null,
            ['DATE', today],
            ['BOM NO', no],
            ['ITEMS', `${T.lineCount} · ${T.totalPcs} PCS`],
            preparedBy ? ['PREPARED BY', preparedBy.toUpperCase()] : null,
        ].filter(Boolean) as [string, string][]);
        let my = 10;
        doc.setDrawColor(...HAIR).setLineWidth(0.25);
        for (const [l, v] of metaRows) {
            doc.line(118, my, W - M, my);
            doc.setFont('DOC', 'bold').setFontSize(7).setTextColor(...GRAY).setCharSpace(0.8).text(l, 118, my + 5);
            doc.setCharSpace(0);
            doc.setFont('DOC', 'normal').setFontSize(8).setTextColor(...INK).text(v, W - M, my + 5, { align: 'right' });
            my += 8;
        }
        doc.line(118, my, W - M, my);

        doc.setFont('DOC', 'bold').setFontSize(11).setTextColor(...WORD).setCharSpace(1.5);
        doc.text(brand.name.toUpperCase(), M, 36);
        doc.setCharSpace(0.6).setFontSize(7).setTextColor(...GRAY);
        doc.text([dealer.addr1.toUpperCase(), `${dealer.addr2}${dealer.phone ? ' · ' + dealer.phone : ''}`.toUpperCase()], M, 41.5);
        doc.setCharSpace(0);
        doc.setFont('DOC', 'bold').setFontSize(7.5).setTextColor(...INK).setCharSpace(0.8);
        doc.text('PRODUCTS', M, my + 12);
        doc.setCharSpace(0);

        const fin = itemsTable({ startY: my + 16, bottom: 50, big: true });
        let y = totalsBlock(fin + 8, H - 56);
        payBlock(M, fin + 13, 98, H - 44);
        let wy = y + 7;
        if (showPrices) {
            doc.setFont('DOC', 'normal').setFontSize(7).setTextColor(...GRAY);
            const words = doc.splitTextToSize(`${inrWords(T.grand).toUpperCase()} RUPEES ONLY`, 78);
            doc.text(words, W - M, wy, { align: 'right' });
            wy += words.length * 3.6 + 4;
        }
        if (note) drawRich(doc, note, 118, wy, W - M - 118, { size: 7.5, lh: 3.9, color: GRAY });

        const pages = doc.getNumberOfPages();
        for (let i = 1; i <= pages; i++) {
            doc.setPage(i);
            let lx = M;
            for (const b of brandLogos) {
                const dw = (b.w / b.h) * 9.5;
                doc.addImage(b.data, 'PNG', lx, H - 40, dw, 9.5);
                lx += dw + 9;
            }
            doc.setFont('DOC', 'normal').setFontSize(6.5).setTextColor(...FOOT).setCharSpace(0.6);
            doc.text(['REGISTERED OFFICE:', dealer.addr1.toUpperCase(), `${dealer.addr2}${dealer.phone ? ' · ' + dealer.phone : ''}`.toUpperCase()].filter(Boolean), M, H - 26);
            doc.text(`${i} / ${pages}`, M, H - 8);
            doc.setCharSpace(0);
            doc.setFontSize(6.5).setTextColor(...SIDE).text(`${brand.name}`, 8, H - 10, { angle: 90 });
        }
    };

    if (brand.template === 'bold') renderBold();
    else if (brand.template === 'studio') renderStudio();
    else renderClassic();

    const filename = `${no} ${cust.name.trim() || 'Customer'} BOM.pdf`;
    if (out === 'blob') return { blob: doc.output('blob'), filename, no, grand: T.grand };
    doc.save(filename);
    return { no, filename, grand: T.grand };
}
