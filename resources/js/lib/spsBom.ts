/**
 * BoM calculator for two sliding-partition hardware systems:
 *   LSPS - Linked Sliding Partition System
 *   SSPS - 2-Way Syncro Sliding Partition System
 *
 * Ported from Aurora-Logic/Projectshine (quickcart/src/lib/spsBom.js) to TypeScript.
 * Pure, framework-free: feed it the inputs, get back line items + totals + warnings.
 *
 * INPUT:  width & material are shared across both systems.
 * RETURN: { lsps, ssps, lspsTotal, sspsTotal, warnings }; line items are qty>0 rows only.
 */

export type Material = 'W' | 'P';

export interface BomInput {
    lspsFixedDoors: number;
    lspsMovableDoors: number;
    sspsFixedDoors: number;
    sspsMovableDoors: number;
    heightFt: number;
    widthFt: number;
    material: Material;
}

export interface LineItem {
    sr: number;
    name: string;
    code: string;
    finish: string;
    qty: number;
    mrp: number;
    amount: number;
}

export interface BomResult {
    lsps: LineItem[];
    ssps: LineItem[];
    lspsTotal: number;
    sspsTotal: number;
    warnings: string[];
}

/** Excel row tuple: [name, code, finish, mrp, qty]. */
type Row = [string, string, string, number, number];

export const LSPS_STOCK_FT = 10; // G7 - ADP2-H stock-length basis for LSPS
export const SSPS_STOCK_FT = 9.8; // G7 - ADP2-H stock-length basis for SSPS (differs; flagged)

const { floor, ceil, trunc, max } = Math;

// horizontal-profile qty (ADP2-H rows): floor pieces-per-stock, ceil the final qty.
function horizProfile(width: number, totalDoors: number, piecesNeeded: number, stockFt: number): { qty: number; warn: string | null } {
    if (totalDoors <= 0) return { qty: 0, warn: null };
    const doorWidth = width / totalDoors; // ft per door
    let piecesPerStock = floor(stockFt / doorWidth); // ROUNDDOWN
    let warn: string | null = null;
    if (piecesPerStock <= 0) {
        // a single door wider than a stock length
        piecesPerStock = 1;
        warn = 'a single door is wider than the profile stock length - horizontal-profile qty clamped (verify the width/door count).';
    }
    return { qty: ceil(piecesNeeded / piecesPerStock), warn }; // ROUNDUP
}

// rows -> line items: keep qty>0 only, renumber Sr.No, compute Amount = MRP x Qty.
function toLineItems(rows: Row[]): LineItem[] {
    const items: LineItem[] = [];
    for (const [name, code, finish, mrp, qty] of rows) {
        if (qty > 0) items.push({ sr: items.length + 1, name, code, finish, qty, mrp, amount: mrp * qty });
    }
    return items;
}

const sumAmount = (items: LineItem[]): number => items.reduce((s, it) => s + it.amount, 0);

export function calculateBoM(input: BomInput): BomResult {
    // Normalise material before ANY compare.
    const mat = String(input.material ?? '').trim().toUpperCase();
    if (mat !== 'P' && mat !== 'W') {
        throw new Error(`Invalid material "${input.material}" - must be "W" (wood) or "P" (profile / aluminium).`);
    }

    const width = Number(input.widthFt);
    const F = max(0, trunc(Number(input.lspsFixedDoors) || 0));
    const M = max(0, trunc(Number(input.lspsMovableDoors) || 0));
    const sF = max(0, trunc(Number(input.sspsFixedDoors) || 0));
    const sM = max(0, trunc(Number(input.sspsMovableDoors) || 0));
    const warnings: string[] = [];

    // width-bucket ladder (mutually exclusive). G2: top bucket extended to width>12.
    const b2440 = width <= 8;
    const b3660 = width > 8 && width <= 12;
    const b5000 = width > 12;

    // ---------------- LSPS ----------------
    const lspsMetric = (M + F) > 0 ? (width * M) / (M + F) : 0; // bottom-guide-track selector
    const lspsH = mat === 'P' ? horizProfile(width, F + M, (F + M) * 2, LSPS_STOCK_FT) : { qty: 0, warn: null };
    if (lspsH.warn) warnings.push('LSPS: ' + lspsH.warn);

    const lspsRows: Row[] = [
        ['Linked Sliding Partition System 100 - Soft Close (Wood 2+1)', 'LSPS-100W-SC', 'TN', 14261, mat === 'W' ? 1 : 0],
        ['Add-on kit - Soft Close (Wood 3+1)', 'AK-LSPS-100W-SC', 'TN', 6095, (mat === 'W' && M === 3) ? 1 : 0],
        ['Linked Sliding Partition System 100 - Soft Close (Al. Frame 2+1)', 'LSPS-100A-SC', 'TN', 15659, mat === 'P' ? 1 : 0],
        ['Add-on kit - Soft Close (Al. Frame 3+1)', 'AK-LSPS-100A-SC', 'TN', 7067, (mat === 'P' && M === 3) ? 1 : 0],
        ['Top Sliding Track - 2440 mm', 'TST1-2-AB', 'AB', 3103, b2440 ? (M + 1) : 0],
        ['Top Sliding Track - 3660 mm', 'TST1-3-AB', 'AB', 4991, b3660 ? (M + 1) : 0],
        ['Top Sliding Track - 5000 mm', 'TST1-5-AB', 'AB', 6204, b5000 ? (M + 1) : 0],
        ['Bottom Guide Track - 2440 mm', 'BGT-2-AB', 'AB', 748, mat === 'P' ? 0 : (lspsMetric <= 8 ? 1 : 0)],
        ['Bottom Guide Track - 3660 mm', 'BGT-3', 'AB', 1177, mat === 'P' ? 0 : (lspsMetric > 8 && lspsMetric <= 12 ? 1 : 0)],
        ['Top Track Cover Profile (optional)', 'TTCP-2', 'AB', 1413, b2440 ? 1 : 0],
        ['Top Track Cover Profile (optional)', 'TTCP-3', 'AB', 2066, b3660 ? 1 : 0],
        ['Top Track Cover Profile (optional)', 'TTCP-5', 'AB', 2826, b5000 ? 1 : 0],
        ['Aluminium Door Profile Horizontal (Top & Bottom w/ sleeve) - Black', 'ADP2-H', 'AB', 3300, lspsH.qty],
        ['Aluminium Door Profile Vertical w/ sleeve - Black', 'ADP2-V', 'AB', 2472, mat === 'P' ? (F + M) * 2 : 0],
        ['RA Join Connector for ADP2', 'RA-JC-ADP2', 'SL', 367, mat === 'P' ? (F + M) : 0],
        ['Handle with Latch (set of 2)', 'HL1-SPS', 'BL', 2351, mat === 'P' ? 1 : 0],
        ['Fixed Door Bracket Kit - Wood', 'SPS-FDBW1', 'ZW', 955, mat === 'W' ? 1 : 0],
        ['Fixed Door Bracket Kit - Aluminium', 'SPS-FDBA1', 'ZW', 955, mat === 'P' ? 1 : 0],
    ];

    // ---------------- SSPS (constants built around 2 fixed + 2 movable) ----------------
    const sspsH = mat === 'P' ? horizProfile(width, sF + sM, 8, SSPS_STOCK_FT) : { qty: 0, warn: null };
    if (sspsH.warn) warnings.push('SSPS: ' + sspsH.warn);

    const sspsRows: Row[] = [
        ['2-Way Syncro SPS 100 - Soft Close (Wood 2+2)', 'SSPS-100W-SC', 'TN', 17699, mat === 'W' ? 1 : 0],
        ['2-Way Syncro SPS 100 - Soft Close (Al. Frame 2+2)', 'SSPS-100A-SC', 'TN', 21073, mat === 'P' ? 1 : 0],
        ['Top Sliding Track - 2440 mm', 'TST1-2', 'AB', 3103, b2440 ? 2 : 0],
        ['Top Sliding Track - 3660 mm', 'TST1-3', 'AB', 4991, b3660 ? 2 : 0],
        ['Top Sliding Track - 5000 mm', 'TST1-5', 'AB', 6204, b5000 ? 2 : 0],
        ['Bottom Guide Track - 2440 mm', 'BGT-2', 'AB', 748, mat === 'P' ? 0 : ((width / 2) <= 8 ? 1 : 0)],
        ['Top Track Cover Profile (optional)', 'TTCP-2', 'AB', 1413, b2440 ? 1 : 0],
        ['Top Track Cover Profile (optional)', 'TTCP-3', 'AB', 2066, b3660 ? 1 : 0],
        ['Top Track Cover Profile (optional)', 'TTCP-5', 'AB', 2826, b5000 ? 1 : 0],
        ['Aluminium Door Profile Horizontal - Black', 'ADP2-H', 'AB', 3300, sspsH.qty],
        ['Aluminium Door Profile Vertical - Black', 'ADP2-V', 'AB', 2472, mat === 'P' ? 8 : 0],
        ['RA Join Connector for ADP2', 'RA-JC-ADP2', 'SL', 367, mat === 'P' ? 4 : 0],
        ['Handle with Latch (set of 2)', 'HL1-SPS', 'BL', 2351, mat === 'P' ? 1 : 0],
        ['Fixed Door Bracket Kit - Wood', 'SPS-FDBW1', 'ZW', 955, mat === 'W' ? 2 : 0],
        ['Fixed Door Bracket Kit - Aluminium', 'SPS-FDBA1', 'ZW', 955, mat === 'P' ? 2 : 0],
    ];

    // ---- non-fatal warnings (G4 / G5 / G6) ----
    if (M !== 2 && M !== 3) {
        warnings.push(`LSPS: ${M} movable doors - only 2 (base) or 3 (base + add-on) are fully modeled; verify the kit.`);
    }
    if (sF !== 2 || sM !== 2) {
        warnings.push(`SSPS: quantities assume a 2-fixed + 2-movable layout; your SSPS config is ${sF}+${sM}, so the constant quantities may not apply.`);
    }
    if (mat === 'W') {
        warnings.push('Handle (HL1-SPS) is profile-only - wood doors get no handle in this BoM; verify intended.');
    }

    const lsps = toLineItems(lspsRows);
    const ssps = toLineItems(sspsRows);
    return { lsps, ssps, lspsTotal: sumAmount(lsps), sspsTotal: sumAmount(ssps), warnings };
}
