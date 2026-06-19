import { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';
import { calculateBoM, type Material, type LineItem } from '@/lib/spsBom';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

interface NumberFieldProps {
    id: string;
    label: string;
    value: number;
    onChange: (n: number) => void;
}

function NumberField({ id, label, value, onChange }: NumberFieldProps) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input id={id} type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
        </div>
    );
}

function BomTable({ title, items, total }: { title: string; items: LineItem[]; total: number }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{items.length} line items</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                {items.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No items for this configuration.</p>
                ) : (
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
                                        <span className="block text-xs font-normal text-muted-foreground">{it.finish}</span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{it.code}</TableCell>
                                    <TableCell className="text-right tabular-nums">{it.qty}</TableCell>
                                    <TableCell className="text-right tabular-nums">{inr.format(it.mrp)}</TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">{inr.format(it.amount)}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell colSpan={5} className="text-right font-semibold">Total</TableCell>
                                <TableCell className="text-right font-bold tabular-nums">{inr.format(total)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

export default function BomIndex() {
    const [lspsFixedDoors, setLspsFixed] = useState(2);
    const [lspsMovableDoors, setLspsMovable] = useState(2);
    const [sspsFixedDoors, setSspsFixed] = useState(2);
    const [sspsMovableDoors, setSspsMovable] = useState(2);
    const [widthFt, setWidth] = useState(10);
    const [heightFt, setHeight] = useState(8);
    const [material, setMaterial] = useState<Material>('P');

    const result = useMemo(() => {
        try {
            return calculateBoM({ lspsFixedDoors, lspsMovableDoors, sspsFixedDoors, sspsMovableDoors, widthFt, heightFt, material });
        } catch {
            return null;
        }
    }, [lspsFixedDoors, lspsMovableDoors, sspsFixedDoors, sspsMovableDoors, widthFt, heightFt, material]);

    const grandTotal = result ? result.lspsTotal + result.sspsTotal : 0;

    return (
        <AdminLayout breadcrumbs={[{ label: 'BOM Calculator' }]}>
            <Head title="BOM Calculator" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">BOM Calculator</h1>
                    <p className="text-sm text-muted-foreground">Bill of materials for LSPS and SSPS sliding-partition systems. Updates as you type.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Width and material are shared across both systems.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="material">Material</Label>
                            <Select value={material} onValueChange={(v) => setMaterial(v as Material)}>
                                <SelectTrigger id="material"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="P">Profile / Aluminium</SelectItem>
                                    <SelectItem value="W">Wood</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <NumberField id="widthFt" label="Width (ft)" value={widthFt} onChange={setWidth} />
                        <NumberField id="heightFt" label="Height (ft)" value={heightFt} onChange={setHeight} />
                        <div className="hidden lg:block" />
                        <NumberField id="lspsFixed" label="LSPS fixed doors" value={lspsFixedDoors} onChange={setLspsFixed} />
                        <NumberField id="lspsMovable" label="LSPS movable doors" value={lspsMovableDoors} onChange={setLspsMovable} />
                        <NumberField id="sspsFixed" label="SSPS fixed doors" value={sspsFixedDoors} onChange={setSspsFixed} />
                        <NumberField id="sspsMovable" label="SSPS movable doors" value={sspsMovableDoors} onChange={setSspsMovable} />
                    </CardContent>
                </Card>

                {result && (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
                        <span className="text-sm text-muted-foreground">Grand total (LSPS + SSPS)</span>
                        <span className="text-2xl font-bold tabular-nums">{inr.format(grandTotal)}</span>
                    </div>
                )}

                {result && result.warnings.length > 0 && (
                    <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                        <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
                            <AlertTriangle className="h-4 w-4" /> Warnings
                        </p>
                        <ul className="list-disc space-y-1 pl-6 text-xs text-amber-800 dark:text-amber-200">
                            {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                    </div>
                )}

                {result && (
                    <div className="grid gap-6 xl:grid-cols-2">
                        <BomTable title="LSPS - Linked Sliding Partition System" items={result.lsps} total={result.lspsTotal} />
                        <BomTable title="SSPS - 2-Way Syncro Sliding Partition System" items={result.ssps} total={result.sspsTotal} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
