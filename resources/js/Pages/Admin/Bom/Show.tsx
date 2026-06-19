import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Download, Pencil } from 'lucide-react';
import { inrWords } from '@/lib/estimateMoney';
import { generateEstimatePdf } from '@/lib/estimatePdf';
import { buildBrand, toPdfItems, toPdfCustomer } from '@/lib/estimateBrand';
import type { Estimate, EstimateSetting } from '@/types';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function EstimateShow({ estimate, settings, brandLogos }: { estimate: Estimate; settings: EstimateSetting; brandLogos: string[] }) {
    const c = estimate.customer;
    const subtotal = estimate.item_total - estimate.scheme_off - estimate.special_discount + estimate.delivery_fee;

    const downloadPdf = async () => {
        try {
            await generateEstimatePdf({
                cust: toPdfCustomer(c),
                items: toPdfItems(estimate.line_items),
                brand: buildBrand(settings, { template: estimate.template, accent: estimate.accent, showPrices: estimate.show_prices, showScheme: estimate.show_scheme, gstPct: estimate.gst_pct }, brandLogos),
                special: estimate.special_discount,
                deliveryFee: estimate.delivery_fee,
                express: estimate.express,
                meta: { no: estimate.estimate_no, date: estimate.created_at },
            });
        } catch (e) {
            toast.error('Could not generate the PDF.');
            console.error(e);
        }
    };

    return (
        <AdminLayout breadcrumbs={[{ label: 'BOM', href: '/admin/bom' }, { label: estimate.estimate_no }]}>
            <Head title={estimate.estimate_no} />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <Button asChild variant="ghost" size="sm"><Link href="/admin/bom"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{estimate.estimate_no}</h1>
                        <p className="text-sm text-muted-foreground">{c?.name}{c?.company ? ` · ${c.company}` : ''}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={downloadPdf}><Download className="h-4 w-4" /> Download PDF</Button>
                        <Button asChild><Link href={`/admin/bom/${estimate.id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link></Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{estimate.template}</Badge>
                    {estimate.gst_pct > 0 && <Badge variant="secondary">GST {estimate.gst_pct}%</Badge>}
                    {c?.gstin && <Badge variant="secondary">GSTIN {c.gstin}</Badge>}
                    {c?.phone && <Badge variant="secondary">{c.phone}</Badge>}
                </div>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Line items</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-8">#</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Unit price</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {estimate.line_items.map((l, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                        <TableCell className="font-medium">{l.name}{(l.item_no || l.spec) && <span className="block text-xs font-normal text-muted-foreground">{[l.item_no, l.spec].filter(Boolean).join(' · ')}</span>}</TableCell>
                                        <TableCell className="text-right tabular-nums">{l.qty}</TableCell>
                                        <TableCell className="text-right tabular-nums">{inr.format(l.unit_price)}</TableCell>
                                        <TableCell className="text-right font-medium tabular-nums">{inr.format(l.unit_price * l.qty)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Card className="w-full max-w-sm">
                        <CardContent className="space-y-1.5 pt-6 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Item total</span><span className="tabular-nums">{inr.format(estimate.item_total)}</span></div>
                            {estimate.scheme_off > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Volume scheme</span><span className="tabular-nums">- {inr.format(estimate.scheme_off)}</span></div>}
                            {estimate.special_discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Special discount</span><span className="tabular-nums">- {inr.format(estimate.special_discount)}</span></div>}
                            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="tabular-nums">{estimate.delivery_fee === 0 ? 'FREE' : inr.format(estimate.delivery_fee)}</span></div>
                            {estimate.gst_pct > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{inr.format(subtotal)}</span></div>}
                            {estimate.gst_pct > 0 && <div className="flex justify-between"><span className="text-muted-foreground">GST ({estimate.gst_pct}%)</span><span className="tabular-nums">{inr.format(estimate.gst_amt)}</span></div>}
                            <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><span>Total</span><span className="tabular-nums" style={{ color: estimate.accent }}>{inr.format(estimate.grand_total)}</span></div>
                            {estimate.grand_total > 0 && <p className="pt-1 text-xs capitalize text-muted-foreground">{inrWords(estimate.grand_total)} rupees only</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
