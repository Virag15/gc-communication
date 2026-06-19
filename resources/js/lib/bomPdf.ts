/**
 * Client-side BOM estimate PDF, built with jsPDF + jspdf-autotable.
 *
 * The standard jsPDF (Helvetica) fonts have no Rupee glyph (U+20B9), so amounts
 * are prefixed "Rs." rather than the symbol to avoid garbled output.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Bom, BomCompany, BomLineItem } from '@/types';

const inr = (n: number) => 'Rs. ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));

function hexToRgb(hex: string): [number, number, number] {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [37, 99, 235];
}

function slug(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'bom';
}

/** Build the BOM estimate PDF and trigger a download. */
export function downloadBomPdf(bom: Bom, company: BomCompany): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    const accent = hexToRgb(bom.accent || '#2563eb');
    const bold = bom.template === 'bold';

    // Accent header band.
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(0, 0, pageW, bold ? 14 : 8, 'F');

    // Company letterhead (left).
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(25, 25, 25);
    doc.text(company.name || 'GC Communication', margin, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    let cy = 64;
    const contactLines = [
        company.address,
        [company.phone, company.email].filter(Boolean).join('   |   '),
    ].filter(Boolean) as string[];
    contactLines.forEach((line) => {
        doc.text(line, margin, cy);
        cy += 12;
    });

    // Estimate badge (right).
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text('ESTIMATE', pageW - margin, 50, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), pageW - margin, 64, { align: 'right' });

    // Divider.
    let y = Math.max(cy, 78) + 10;
    doc.setDrawColor(228, 228, 228);
    doc.line(margin, y, pageW - margin, y);
    y += 20;

    // BOM name + configuration + customer.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(25, 25, 25);
    doc.text(bom.name, margin, y);
    if (bom.customer) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);
        doc.text(`Customer: ${bom.customer}`, pageW - margin, y, { align: 'right' });
    }
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    const matLabel = bom.material === 'W' ? 'Wood' : 'Aluminium / Profile';
    doc.text(`${matLabel}   |   ${bom.width_ft} x ${bom.height_ft} ft   |   LSPS ${bom.lsps_fixed}+${bom.lsps_movable}   |   SSPS ${bom.ssps_fixed}+${bom.ssps_movable}`, margin, y);
    y += 6;

    const sections: { title: string; items: BomLineItem[]; total: number }[] = [
        { title: 'LSPS  -  Linked Sliding Partition System', items: bom.line_items.filter((i) => i.system === 'LSPS'), total: bom.lsps_total },
        { title: 'SSPS  -  2-Way Syncro Sliding Partition System', items: bom.line_items.filter((i) => i.system === 'SSPS'), total: bom.ssps_total },
    ];

    for (const sec of sections) {
        if (!sec.items.length) continue;
        autoTable(doc, {
            startY: y + 10,
            head: [
                [{ content: sec.title, colSpan: 6, styles: { halign: 'left', fillColor: accent, textColor: 255, fontStyle: 'bold', fontSize: 10 } }],
                ['#', 'Item', 'Code', 'Qty', 'MRP', 'Amount'],
            ],
            body: sec.items.map((it) => [
                String(it.sr),
                it.finish ? `${it.name}\n${it.finish}` : it.name,
                it.code || '-',
                String(it.qty),
                inr(it.mrp),
                inr(it.amount),
            ]),
            foot: [[{ content: 'Subtotal', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, inr(sec.total)]],
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8, textColor: [45, 45, 45], cellPadding: 4 },
            footStyles: { fillColor: [248, 248, 248], textColor: [25, 25, 25], fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 22, halign: 'center' },
                2: { cellWidth: 70 },
                3: { cellWidth: 38, halign: 'right' },
                4: { cellWidth: 68, halign: 'right' },
                5: { cellWidth: 78, halign: 'right' },
            },
            margin: { left: margin, right: margin },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 12;
    }

    // Grand total chip.
    const boxW = 230;
    const boxH = 32;
    const boxX = pageW - margin - boxW;
    if (y + boxH > pageH - 50) {
        doc.addPage();
        y = margin;
    }
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.roundedRect(boxX, y, boxW, boxH, 5, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('GRAND TOTAL', boxX + 14, y + 20);
    doc.text(inr(bom.grand_total), boxX + boxW - 14, y + 20, { align: 'right' });
    y += boxH + 18;

    // Notes.
    if (bom.notes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        const lines = doc.splitTextToSize(`Notes: ${bom.notes}`, pageW - margin * 2);
        doc.text(lines, margin, y);
    }

    // Footer.
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text('All prices are indicative MRP and exclusive of taxes unless stated otherwise.', margin, pageH - 26);
    doc.text(`${company.name || 'GC Communication'}`, pageW - margin, pageH - 26, { align: 'right' });

    doc.save(`${slug(bom.name)}-estimate.pdf`);
}
