import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Pencil } from 'lucide-react';
import { downloadBomPdf } from '@/lib/bomPdf';
import type { Bom, BomCompany, BomLineItem } from '@/types';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function ReadSection({ title, items, total }: { title: string; items: BomLineItem[]; total: number }) {
    if (!items.length) return null;
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{items.length} line items</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">MRP</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((it) => (
                            <TableRow key={it.sr}>
                                <TableCell className="text-muted-foreground">{it.sr}</TableCell>
                                <TableCell className="font-medium">
                                    {it.name}
                                    {it.finish && <span className="block text-xs font-normal text-muted-foreground">{it.finish}</span>}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{it.code}</TableCell>
                                <TableCell className="text-right tabular-nums">{it.qty}</TableCell>
                                <TableCell className="text-right tabular-nums">{inr.format(it.mrp)}</TableCell>
                                <TableCell className="text-right font-medium tabular-nums">{inr.format(it.amount)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={5} className="text-right font-semibold">Subtotal</TableCell>
                            <TableCell className="text-right font-bold tabular-nums">{inr.format(total)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function BomShow({ bom, company }: { bom: Bom; company: BomCompany }) {
    const lsps = bom.line_items.filter((i) => i.system === 'LSPS');
    const ssps = bom.line_items.filter((i) => i.system === 'SSPS');

    return (
        <AdminLayout breadcrumbs={[{ label: 'BOM', href: '/admin/bom' }, { label: bom.name }]}>
            <Head title={bom.name} />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/admin/bom"><ArrowLeft className="h-4 w-4" /> Back</Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{bom.name}</h1>
                        {bom.customer && <p className="text-sm text-muted-foreground">{bom.customer}</p>}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={() => downloadBomPdf(bom, company)}><Download className="h-4 w-4" /> Download PDF</Button>
                        <Button asChild><Link href={`/admin/bom/${bom.id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link></Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{bom.material === 'W' ? 'Wood' : 'Aluminium / Profile'}</Badge>
                    <Badge variant="secondary">{bom.width_ft} x {bom.height_ft} ft</Badge>
                    <Badge variant="secondary">LSPS {bom.lsps_fixed}+{bom.lsps_movable}</Badge>
                    <Badge variant="secondary">SSPS {bom.ssps_fixed}+{bom.ssps_movable}</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
                    <span className="text-sm text-muted-foreground">Grand total</span>
                    <span className="text-2xl font-bold tabular-nums" style={{ color: bom.accent }}>{inr.format(bom.grand_total)}</span>
                </div>

                <ReadSection title="LSPS - Linked Sliding Partition System" items={lsps} total={bom.lsps_total} />
                <ReadSection title="SSPS - 2-Way Syncro Sliding Partition System" items={ssps} total={bom.ssps_total} />

                {bom.notes && (
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base">Notes</CardTitle></CardHeader>
                        <CardContent><p className="whitespace-pre-line text-sm text-muted-foreground">{bom.notes}</p></CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
