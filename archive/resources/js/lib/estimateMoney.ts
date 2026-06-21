/**
 * Estimate money math - pure helpers shared by the editor and the PDF.
 *
 * Bulk pricing: a product can carry a hint like "10+ @ 350" or "20+ @ ₹265".
 * Once a line's qty crosses the threshold, the tier price becomes the unit price.
 * Volume scheme: slab discounts on the item total.
 */

export interface BulkTier {
    thr: number;
    bp: number;
    pct: number;
}

/** Parse a bulk hint ("10+ @ 350", "20+ @ ₹265/set") against a list price. */
export function bulkTier(bulk?: string | null, price = 0): BulkTier | null {
    if (!bulk) return null;
    const m = bulk.match(/(\d+)\s*\+\s*@\s*₹?\s*([\d,]+)/);
    if (!m) return null;
    const bp = Number(m[2].replace(/,/g, ''));
    if (!Number.isFinite(bp)) return null;
    return { thr: Number(m[1]), bp, pct: price ? Math.max(1, Math.round((1 - bp / price) * 100)) : 0 };
}

/** Effective unit price for n units given an optional bulk hint. */
export function unitPriceFor(price: number, bulk: string | null | undefined, n: number): number {
    const t = bulkTier(bulk, price);
    return t && n >= t.thr ? t.bp : price;
}

/** Volume scheme slabs (item total -> % off). Highest matching slab wins. */
export const SCHEMES: { min: number; off: number }[] = [
    { min: 10000, off: 1 },
    { min: 25000, off: 2 },
    { min: 50000, off: 3 },
];

export function schemeFor(itemTotal: number): { pct: number; off: number } {
    const slab = [...SCHEMES].reverse().find((s) => itemTotal >= s.min);
    if (!slab) return { pct: 0, off: 0 };
    return { pct: slab.off, off: Math.round((itemTotal * slab.off) / 100) };
}

export interface EstimateLine {
    itemNo: string;
    name: string;
    spec?: string;
    qty: number;
    unitPrice: number;
    mrp?: number | null;
    image?: string | null;
}

export interface EstimateTotals {
    itemTotal: number;
    mrpSave: number;
    schemePct: number;
    schemeOff: number;
    special: number;
    deliveryFee: number;
    subtotal: number;
    gstPct: number;
    gstAmt: number;
    grand: number;
    totalPcs: number;
    lineCount: number;
}

/** Compute the full bill from lines + options. */
export function computeTotals(
    lines: EstimateLine[],
    opts: { showScheme?: boolean; gstPct?: number; special?: number; deliveryFee?: number } = {},
): EstimateTotals {
    const itemTotal = lines.reduce((s, l) => s + (Number(l.unitPrice) || 0) * (Number(l.qty) || 0), 0);
    const mrpSave = lines.reduce((s, l) => {
        const mrp = Number(l.mrp) || 0;
        const up = Number(l.unitPrice) || 0;
        return s + (mrp > up ? (mrp - up) * (Number(l.qty) || 0) : 0);
    }, 0);
    const scheme = opts.showScheme === false ? { pct: 0, off: 0 } : schemeFor(itemTotal);
    const special = Math.max(0, Number(opts.special) || 0);
    const deliveryFee = Math.max(0, Number(opts.deliveryFee) || 0);
    const subtotal = Math.max(0, itemTotal - scheme.off - special + deliveryFee);
    const gstPct = Number(opts.gstPct) || 0;
    const gstAmt = gstPct ? Math.round((subtotal * gstPct) / 100) : 0;
    const grand = subtotal + gstAmt;
    return {
        itemTotal,
        mrpSave,
        schemePct: scheme.pct,
        schemeOff: scheme.off,
        special,
        deliveryFee,
        subtotal,
        gstPct,
        gstAmt,
        grand,
        totalPcs: lines.reduce((s, l) => s + (Number(l.qty) || 0), 0),
        lineCount: lines.length,
    };
}

/** Amount in words, Indian grouping (lakh / crore). */
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const two = (n: number): string => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''));
const three = (n: number): string => (n >= 100 ? ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' : '') : '') + (n % 100 ? two(n % 100) : '');

export function inrWords(n: number): string {
    n = Math.round(n);
    if (!n) return 'zero';
    const cr = Math.floor(n / 1e7);
    const l = Math.floor(n / 1e5) % 100;
    const t = Math.floor(n / 1e3) % 100;
    const h = n % 1000;
    return [cr && two(cr) + ' crore', l && two(l) + ' lakh', t && two(t) + ' thousand', h && three(h)]
        .filter(Boolean)
        .join(', ');
}
