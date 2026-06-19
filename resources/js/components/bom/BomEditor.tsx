import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Download, Loader2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { calculateBoM, type Material } from '@/lib/spsBom';
import { downloadBomPdf } from '@/lib/bomPdf';
import type { Bom, BomCompany, BomLineItem } from '@/types';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const SWATCHES = ['#2563eb', '#0f172a', '#16a34a', '#ec4899', '#f59e0b', '#7c3aed'];

interface Config {
    material: Material;
    widthFt: number;
    heightFt: number;
    lspsFixed: number;
    lspsMovable: number;
    sspsFixed: number;
    sspsMovable: number;
}

function generate(cfg: Config): { items: BomLineItem[]; warnings: string[] } {
    try {
        const r = calculateBoM({
            lspsFixedDoors: cfg.lspsFixed,
            lspsMovableDoors: cfg.lspsMovable,
            sspsFixedDoors: cfg.sspsFixed,
            sspsMovableDoors: cfg.sspsMovable,
            widthFt: cfg.widthFt,
            heightFt: cfg.heightFt,
            material: cfg.material,
        });
        const items: BomLineItem[] = [
            ...r.lsps.map((li) => ({ system: 'LSPS' as const, ...li, custom: false })),
            ...r.ssps.map((li) => ({ system: 'SSPS' as const, ...li, custom: false })),
        ];
        return { items, warnings: r.warnings };
    } catch (e) {
        return { items: [], warnings: [(e as Error).message] };
    }
}

interface NumFieldProps {
    id: string;
    label: string;
    value: number;
    step?: number;
    onChange: (n: number) => void;
}

function NumField({ id, label, value, step, onChange }: NumFieldProps) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input id={id} type="number" min={0} step={step} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
        </div>
    );
}

export default function BomEditor({ bom, company }: { bom?: Bom; company: BomCompany }) {
    const isEdit = !!bom;

    const [material, setMaterial] = useState<Material>(bom?.material ?? 'P');
    const [widthFt, setWidth] = useState(bom?.width_ft ?? 10);
    const [heightFt, setHeight] = useState(bom?.height_ft ?? 8);
    const [lspsFixed, setLspsFixed] = useState(bom?.lsps_fixed ?? 2);
    const [lspsMovable, setLspsMovable] = useState(bom?.lsps_movable ?? 2);
    const [sspsFixed, setSspsFixed] = useState(bom?.ssps_fixed ?? 2);
    const [sspsMovable, setSspsMovable] = useState(bom?.ssps_movable ?? 2);

    const [name, setName] = useState(bom?.name ?? '');
    const [customer, setCustomer] = useState(bom?.customer ?? '');
    const [accent, setAccent] = useState(bom?.accent ?? '#2563eb');
    const [template, setTemplate] = useState(bom?.template ?? 'classic');
    const [notes, setNotes] = useState(bom?.notes ?? '');

    const initial = useMemo(
        () => (bom ? { items: bom.line_items, warnings: [] as string[] } : generate({ material: 'P', widthFt: 10, heightFt: 8, lspsFixed: 2, lspsMovable: 2, sspsFixed: 2, sspsMovable: 2 })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );
    const [items, setItems] = useState<BomLineItem[]>(initial.items);
    const [warnings, setWarnings] = useState<string[]>(initial.warnings);
    const [processing, setProcessing] = useState(false);

    const regenerate = () => {
        const g = generate({ material, widthFt, heightFt, lspsFixed, lspsMovable, sspsFixed, sspsMovable });
        setItems(g.items);
        setWarnings(g.warnings);
        toast.success('Line items regenerated from configuration.');
    };

    const updateItem = (idx: number, patch: Partial<BomLineItem>) => {
        setItems((prev) =>
            prev.map((it, i) => {
                if (i !== idx) return it;
                const next = { ...it, ...patch };
                if ('qty' in patch || 'mrp' in patch) next.amount = (Number(next.qty) || 0) * (Number(next.mrp) || 0);
                return next;
            }),
        );
    };
    const deleteItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
    const addItem = (system: 'LSPS' | 'SSPS') =>
        setItems((prev) => [...prev, { system, sr: 0, name: '', code: '', finish: '', qty: 1, mrp: 0, amount: 0, custom: true }]);

    const lspsTotal = items.filter((i) => i.system === 'LSPS').reduce((s, i) => s + i.amount, 0);
    const sspsTotal = items.filter((i) => i.system === 'SSPS').reduce((s, i) => s + i.amount, 0);
    const grand = lspsTotal + sspsTotal;

    const buildBom = (): Bom => {
        const sr: Record<'LSPS' | 'SSPS', number> = { LSPS: 0, SSPS: 0 };
        const lineItems = items.map((it) => ({ ...it, sr: ++sr[it.system], amount: (Number(it.qty) || 0) * (Number(it.mrp) || 0) }));
        return {
            id: bom?.id ?? 0,
            name: name || 'Untitled BOM',
            customer: customer || null,
            material,
            width_ft: widthFt,
            height_ft: heightFt,
            lsps_fixed: lspsFixed,
            lsps_movable: lspsMovable,
            ssps_fixed: sspsFixed,
            ssps_movable: sspsMovable,
            line_items: lineItems,
            lsps_total: lspsTotal,
            ssps_total: sspsTotal,
            grand_total: grand,
            template,
            accent,
            notes: notes || null,
            created_at: bom?.created_at ?? '',
            updated_at: bom?.updated_at ?? '',
        };
    };

    const save = () => {
        if (!name.trim()) return toast.error('Please name this BOM before saving.');
        if (!items.length) return toast.error('Add at least one line item.');
        const payload = {
            name,
            customer,
            material,
            width_ft: widthFt,
            height_ft: heightFt,
            lsps_fixed: lspsFixed,
            lsps_movable: lspsMovable,
            ssps_fixed: sspsFixed,
            ssps_movable: sspsMovable,
            line_items: items.map((it) => ({ system: it.system, name: it.name, code: it.code, finish: it.finish, qty: Number(it.qty) || 0, mrp: Number(it.mrp) || 0, custom: !!it.custom })),
            template,
            accent,
            notes,
        };
        setProcessing(true);
        const opts = {
            onSuccess: () => toast.success(isEdit ? 'BOM updated.' : 'BOM saved.'),
            onError: () => toast.error('Please fix the errors and try again.'),
            onFinish: () => setProcessing(false),
        };
        if (isEdit) router.put(`/admin/bom/${bom!.id}`, payload, opts);
        else router.post('/admin/bom', payload, opts);
    };

    const downloadPdf = () => {
        if (!items.length) return toast.error('Nothing to export yet.');
        downloadBomPdf(buildBom(), company);
    };

    const indexed = items.map((it, idx) => ({ it, idx }));
    const lspsRows = indexed.filter((r) => r.it.system === 'LSPS');
    const sspsRows = indexed.filter((r) => r.it.system === 'SSPS');

    const Section = ({ title, system, rows, subtotal }: { title: string; system: 'LSPS' | 'SSPS'; rows: { it: BomLineItem; idx: number }[]; subtotal: number }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <div>
                    <CardTitle className="text-base">{title}</CardTitle>
                    <CardDescription>{rows.length} line items</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => addItem(system)}>
                    <Plus className="h-3.5 w-3.5" /> Add item
                </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead className="min-w-[200px]">Item</TableHead>
                            <TableHead className="w-28">Code</TableHead>
                            <TableHead className="w-20 text-right">Qty</TableHead>
                            <TableHead className="w-28 text-right">MRP</TableHead>
                            <TableHead className="w-28 text-right">Amount</TableHead>
                            <TableHead className="w-8" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">No items. Add one or regenerate from the configuration.</TableCell>
                            </TableRow>
                        ) : (
                            rows.map(({ it, idx }, n) => (
                                <TableRow key={idx}>
                                    <TableCell className="text-muted-foreground">{n + 1}</TableCell>
                                    <TableCell>
                                        {it.custom ? (
                                            <Input value={it.name} placeholder="Item name" onChange={(e) => updateItem(idx, { name: e.target.value })} className="h-8" />
                                        ) : (
                                            <>
                                                <span className="font-medium">{it.name}</span>
                                                {it.finish && <span className="block text-xs text-muted-foreground">{it.finish}</span>}
                                            </>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {it.custom ? (
                                            <Input value={it.code} placeholder="Code" onChange={(e) => updateItem(idx, { code: e.target.value })} className="h-8" />
                                        ) : (
                                            <span className="text-muted-foreground">{it.code}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Input type="number" min={0} value={it.qty} onChange={(e) => updateItem(idx, { qty: Number(e.target.value) || 0 })} className="h-8 text-right" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Input type="number" min={0} value={it.mrp} onChange={(e) => updateItem(idx, { mrp: Number(e.target.value) || 0 })} className="h-8 text-right" />
                                    </TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">{inr.format(it.amount)}</TableCell>
                                    <TableCell>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-red-700" onClick={() => deleteItem(idx)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                        <TableRow>
                            <TableCell colSpan={5} className="text-right font-semibold">Subtotal</TableCell>
                            <TableCell className="text-right font-bold tabular-nums">{inr.format(subtotal)}</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/admin/bom"><ArrowLeft className="h-4 w-4" /> Back</Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">{isEdit ? 'Edit BOM' : 'New BOM'}</h1>
                <div className="ml-auto flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={downloadPdf}><Download className="h-4 w-4" /> Download PDF</Button>
                    <Button type="button" onClick={save} disabled={processing}>
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {isEdit ? 'Update' : 'Save'} BOM
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Configuration */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2">
                        <div>
                            <CardTitle>Configuration</CardTitle>
                            <CardDescription>Width and material are shared across both systems.</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={regenerate}><RefreshCw className="h-3.5 w-3.5" /> Regenerate</Button>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
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
                        <div className="hidden sm:block" />
                        <NumField id="widthFt" label="Width (ft)" value={widthFt} step={0.5} onChange={setWidth} />
                        <NumField id="heightFt" label="Height (ft)" value={heightFt} step={0.5} onChange={setHeight} />
                        <NumField id="lspsFixed" label="LSPS fixed doors" value={lspsFixed} onChange={setLspsFixed} />
                        <NumField id="lspsMovable" label="LSPS movable doors" value={lspsMovable} onChange={setLspsMovable} />
                        <NumField id="sspsFixed" label="SSPS fixed doors" value={sspsFixed} onChange={setSspsFixed} />
                        <NumField id="sspsMovable" label="SSPS movable doors" value={sspsMovable} onChange={setSspsMovable} />
                    </CardContent>
                </Card>

                {/* Estimate details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Estimate details</CardTitle>
                        <CardDescription>Naming, customer and the look of the exported PDF.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="name">BOM name *</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Conference room partition" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="customer">Customer</Label>
                                <Input id="customer" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Client / site name" />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="template">PDF template</Label>
                                <Select value={template} onValueChange={setTemplate}>
                                    <SelectTrigger id="template"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="classic">Classic</SelectItem>
                                        <SelectItem value="bold">Bold</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Accent colour</Label>
                                <div className="flex items-center gap-1.5">
                                    {SWATCHES.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setAccent(c)}
                                            style={{ backgroundColor: c }}
                                            className={cn('h-7 w-7 rounded-full border-2 transition', accent === c ? 'border-foreground' : 'border-transparent')}
                                            aria-label={c}
                                        />
                                    ))}
                                    <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Terms, delivery, validity..." />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Grand total */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
                <span className="text-sm text-muted-foreground">Grand total (LSPS + SSPS)</span>
                <span className="text-2xl font-bold tabular-nums" style={{ color: accent }}>{inr.format(grand)}</span>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
                <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200"><AlertTriangle className="h-4 w-4" /> Warnings</p>
                    <ul className="list-disc space-y-1 pl-6 text-xs text-amber-800 dark:text-amber-200">
                        {warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}

            <Section title="LSPS - Linked Sliding Partition System" system="LSPS" rows={lspsRows} subtotal={lspsTotal} />
            <Section title="SSPS - 2-Way Syncro Sliding Partition System" system="SSPS" rows={sspsRows} subtotal={sspsTotal} />
        </div>
    );
}
