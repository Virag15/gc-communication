/** Map our stored EstimateSetting + per-estimate overrides into the PDF brand object. */
import type { EstimateSetting, EstimateLineItem, EstimateCustomerSnapshot } from '@/types';
import type { EstBrand, EstCustomer } from './estimatePdf';
import type { EstimateLine } from './estimateMoney';

export interface BrandOverrides {
    template: string;
    accent: string;
    showPrices: boolean;
    showScheme: boolean;
    gstPct: number;
}

export function buildBrand(s: EstimateSetting, over: BrandOverrides, brandLogos: string[]): EstBrand {
    const toAbs = (u: string) => (u.startsWith('http') ? u : window.location.origin + u);
    return {
        name: s.company_name || 'GC Communication',
        template: (over.template as EstBrand['template']) || 'classic',
        accent: over.accent || s.accent,
        paper: s.paper || '#FFFFFF',
        font: (s.font as EstBrand['font']) || 'inter',
        footer: s.footer_color || '#696E74',
        side: s.side_color || '#696E74',
        wordmark: s.wordmark_color || '#1A1C1F',
        preparedBy: s.prepared_by || '',
        docTitle: s.doc_title || 'Bill of Materials',
        note: s.note || '',
        terms: s.terms || '',
        watermark: s.watermark || '',
        validDays: s.valid_days || 7,
        logosPos: (s.logos_pos as EstBrand['logosPos']) || 'top',
        photos: s.photos,
        showPrices: over.showPrices,
        showScheme: over.showScheme,
        gstPct: over.gstPct,
        logo: s.logo ? toAbs(s.logo) : null,
        dealerLogos: (brandLogos || []).map(toAbs),
        dealer: {
            addr1: s.dealer_addr1 || '',
            addr2: s.dealer_addr2 || '',
            phone: s.dealer_phone || '',
            email: s.dealer_email || '',
            website: s.dealer_website || '',
            gstin: s.dealer_gstin || '',
        },
    };
}

export function toPdfItems(lines: EstimateLineItem[]): EstimateLine[] {
    const toAbs = (u: string) => (u.startsWith('http') || u.startsWith('data:') ? u : window.location.origin + u);
    return lines.map((l) => ({
        itemNo: l.item_no || '',
        name: l.name,
        spec: l.spec || '',
        qty: Number(l.qty) || 0,
        unitPrice: Number(l.unit_price) || 0,
        mrp: l.mrp != null ? Number(l.mrp) : null,
        image: l.image ? toAbs(l.image) : null,
    }));
}

export function toPdfCustomer(c: EstimateCustomerSnapshot): EstCustomer {
    return {
        name: c.name,
        company: c.company,
        phone: c.phone,
        address: c.address,
        gstin: c.gstin,
        refBy: c.ref_by,
    };
}
