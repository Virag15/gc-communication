import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, Download, Loader2, Plus, Save, Search, Trash2, UserPlus } from 'lucide-react';
import { computeTotals, unitPriceFor, inrWords, type EstimateLine } from '@/lib/estimateMoney';
import { generateEstimatePdf } from '@/lib/estimatePdf';
import { buildBrand, toPdfItems, toPdfCustomer } from '@/lib/estimateBrand';
import type { Product, Customer, Estimate, EstimateSetting } from '@/types';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const SWATCHES = ['#2563EB', '#1A2342', '#0F172A', '#14633F', '#C9A44A', '#9A3412'];

interface Line {
    product_id: number | null;
    item_no: string;
    name: string;
    spec: string;
    qty: number;
    unit_price: number;
    mrp: number | null;
    image: string | null;
    _base: number;
    _bulk: string | null;
}

interface Snapshot {
    name: string;
    company: string;
    phone: string;
    email: string;
    address: string;
    gstin: string;
    ref_by: string;
    [key: string]: string;
}

interface EditorProps {
    products: Product[];
    customers: Customer[];
    settings: EstimateSetting;
    brandLogos: string[];
    estimate: Estimate | null;
    nextNo: string;
}

export default function EstimateEditor({ products, customers, settings, brandLogos, estimate, nextNo }: EditorProps) {
    const isEdit = !!estimate;

    const [customerId, setCustomerId] = useState<number | null>(estimate?.customer_id ?? null);
    const [snap, setSnap] = useState<Snapshot>({
        name: estimate?.customer?.name ?? '',
        company: estimate?.customer?.company ?? '',
        phone: estimate?.customer?.phone ?? '',
        email: estimate?.customer?.email ?? '',
        address: estimate?.customer?.address ?? '',
        gstin: estimate?.customer?.gstin ?? '',
        ref_by: estimate?.customer?.ref_by ?? '',
    });

    const [lines, setLines] = useState<Line[]>(
        (estimate?.line_items ?? []).map((l) => ({
            product_id: l.product_id ?? null,
            item_no: l.item_no ?? '',
            name: l.name,
            spec: l.spec ?? '',
            qty: Number(l.qty) || 0,
            unit_price: Number(l.unit_price) || 0,
            mrp: l.mrp != null ? Number(l.mrp) : null,
            image: l.image ?? null,
            _base: Number(l.unit_price) || 0,
            _bulk: null,
        })),
    );

    const [special, setSpecial] = useState(estimate?.special_discount ?? 0);
    const [deliveryFee, setDeliveryFee] = useState(estimate?.delivery_fee ?? 0);
    const [express, setExpress] = useState(estimate?.express ?? false);
    const [gstPct, setGstPct] = useState<number>(estimate?.gst_pct ?? settings.gst_pct ?? 0);
    const [showPrices, setShowPrices] = useState(estimate?.show_prices ?? settings.show_prices ?? true);
    const [showScheme, setShowScheme] = useState(estimate?.show_scheme ?? settings.show_scheme ?? true);
    const [template, setTemplate] = useState(estimate?.template ?? settings.template ?? 'classic');
    const [accent, setAccent] = useState(estimate?.accent ?? settings.accent ?? '#2563EB');
    const [processing, setProcessing] = useState(false);

    const [custQuery, setCustQuery] = useState('');
    const [custOpen, setCustOpen] = useState(false);
    const [prodQuery, setProdQuery] = useState('');

    const custMatches = useMemo(
        () => (custQuery.trim() ? customers.filter((c) => `${c.name} ${c.company ?? ''} ${c.phone ?? ''}`.toLowerCase().includes(custQuery.toLowerCase())).slice(0, 8) : []),
        [customers, custQuery],
    );
    const prodMatches = useMemo(
        () => (prodQuery.trim() ? products.filter((p) => `${p.name} ${p.item_no} ${p.category ?? ''}`.toLowerCase().includes(prodQuery.toLowerCase())).slice(0, 10) : []),
        [products, prodQuery],
    );

    const pickCustomer = (c: Customer) => {
        setCustomerId(c.id);
        setSnap({ name: c.name, company: c.company ?? '', phone: c.phone ?? '', email: c.email ?? '', address: c.address ?? '', gstin: c.gstin ?? '', ref_by: c.ref_by ?? '' });
        setCustQuery('');
        setCustOpen(false);
    };
    const setSnapField = (k: keyof Snapshot, v: string) => setSnap((s) => ({ ...s, [k]: v }));

    const addProduct = (p: Product) => {
        setLines((prev) => {
            const i = prev.findIndex((l) => l.product_id === p.id);
            if (i >= 0) {
                const next = [...prev];
                const qty = next[i].qty + 1;
                next[i] = { ...next[i], qty, unit_price: next[i]._bulk ? unitPriceFor(next[i]._base, next[i]._bulk, qty) : next[i].unit_price };
                return next;
            }
            return [...prev, { product_id: p.id, item_no: p.item_no, name: p.name, spec: p.spec ?? '', qty: 1, unit_price: p.price, mrp: p.mrp, image: p.image, _base: p.price, _bulk: p.bulk }];
        });
        setProdQuery('');
    };
    const addCustom = () => setLines((prev) => [...prev, { product_id: null, item_no: '', name: '', spec: '', qty: 1, unit_price: 0, mrp: null, image: null, _base: 0, _bulk: null }]);
    const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));
    const setLine = (i: number, patch: Partial<Line>) => setLines((prev) => prev.map((l, idx) => {
        if (idx !== i) return l;
        const next = { ...l, ...patch };
        if ('qty' in patch && next._bulk) next.unit_price = unitPriceFor(next._base, next._bulk, next.qty);
        return next;
    }));

    const pdfLines: EstimateLine[] = lines.map((l) => ({ itemNo: l.item_no, name: l.name, spec: l.spec, qty: l.qty, unitPrice: l.unit_price, mrp: l.mrp, image: l.image }));
    const T = useMemo(() => computeTotals(pdfLines, { showScheme, gstPct, special, deliveryFee }), [pdfLines, showScheme, gstPct, special, deliveryFee]);

    const save = () => {
        if (!snap.name.trim()) return toast.error('Add a customer name.');
        if (!lines.length) return toast.error('Add at least one line item.');
        const payload = {
            customer_id: customerId,
            customer: snap,
            line_items: lines.map((l) => ({ product_id: l.product_id, item_no: l.item_no, name: l.name, spec: l.spec, qty: Number(l.qty) || 0, unit_price: Number(l.unit_price) || 0, mrp: l.mrp, image: l.image })),
            special_discount: Number(special) || 0,
            delivery_fee: Number(deliveryFee) || 0,
            express,
            gst_pct: gstPct,
            show_prices: showPrices,
            show_scheme: showScheme,
            template,
            accent,
        };
        setProcessing(true);
        const opts = {
            onSuccess: () => toast.success(isEdit ? 'Estimate updated.' : 'Estimate saved.'),
            onError: () => toast.error('Please fix the errors and try again.'),
            onFinish: () => setProcessing(false),
        };
        if (isEdit) router.put(`/admin/bom/${estimate!.id}`, payload, opts);
        else router.post('/admin/bom', payload, opts);
    };

    const downloadPdf = async () => {
        if (!lines.length) return toast.error('Nothing to export yet.');
        try {
            await generateEstimatePdf({
                cust: toPdfCustomer({ ...snap }),
                items: toPdfItems(lines.map((l) => ({ product_id: l.product_id, item_no: l.item_no, name: l.name, spec: l.spec, qty: l.qty, unit_price: l.unit_price, mrp: l.mrp, image: l.image }))),
                brand: buildBrand(settings, { template, accent, showPrices, showScheme, gstPct }, brandLogos),
                special: Number(special) || 0,
                deliveryFee: Number(deliveryFee) || 0,
                express,
                meta: { no: estimate?.estimate_no ?? nextNo },
            });
        } catch (e) {
            toast.error('Could not generate the PDF.');
            console.error(e);
        }
    };

    return (
        <AdminLayout breadcrumbs={[{ label: 'BOM', href: '/admin/bom' }, { label: isEdit ? estimate!.estimate_no : 'New' }]}>
            <Head title={isEdit ? `Edit ${estimate!.estimate_no}` : 'New estimate'} />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <Button asChild variant="ghost" size="sm"><Link href="/admin/bom"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>
                    <h1 className="text-xl font-bold tracking-tight">{isEdit ? `Edit ${estimate!.estimate_no}` : 'New estimate'}</h1>
                    <div className="ml-auto flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={downloadPdf}><Download className="h-4 w-4" /> Download PDF</Button>
                        <Button type="button" onClick={save} disabled={processing}>
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {isEdit ? 'Update' : 'Save'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-6">
                        {/* Customer */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Customer</CardTitle>
                                <CardDescription>Select an existing customer or enter a new one.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search existing customers..."
                                        value={custQuery}
                                        onChange={(e) => { setCustQuery(e.target.value); setCustOpen(true); }}
                                        onFocus={() => setCustOpen(true)}
                                        className="pl-9"
                                    />
                                    {custOpen && custMatches.length > 0 && (
                                        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
                                            {custMatches.map((c) => (
                                                <button key={c.id} type="button" onClick={() => pickCustomer(c)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
                                                    <span className="font-medium">{c.name}</span>
                                                    <span className="text-xs text-muted-foreground">{c.company || c.phone}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {customerId && <p className="flex items-center gap-2 text-xs text-muted-foreground"><UserPlus className="h-3.5 w-3.5" /> Linked to saved customer #{customerId}. <button type="button" className="underline" onClick={() => setCustomerId(null)}>Detach</button></p>}
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5"><Label>Name *</Label><Input value={snap.name} onChange={(e) => setSnapField('name', e.target.value)} /></div>
                                    <div className="space-y-1.5"><Label>Company</Label><Input value={snap.company} onChange={(e) => setSnapField('company', e.target.value)} /></div>
                                    <div className="space-y-1.5"><Label>Phone</Label><Input value={snap.phone} onChange={(e) => setSnapField('phone', e.target.value)} /></div>
                                    <div className="space-y-1.5"><Label>GSTIN</Label><Input value={snap.gstin} onChange={(e) => setSnapField('gstin', e.target.value)} /></div>
                                    <div className="space-y-1.5 sm:col-span-2"><Label>Site / billing address</Label><Input value={snap.address} onChange={(e) => setSnapField('address', e.target.value)} /></div>
                                    <div className="space-y-1.5"><Label>Ref. by</Label><Input value={snap.ref_by} onChange={(e) => setSnapField('ref_by', e.target.value)} /></div>
                                    <div className="space-y-1.5"><Label>Email</Label><Input value={snap.email} onChange={(e) => setSnapField('email', e.target.value)} /></div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Products */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                                <div>
                                    <CardTitle className="text-base">Line items</CardTitle>
                                    <CardDescription>Search products to add, or add a custom line.</CardDescription>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addCustom}><Plus className="h-3.5 w-3.5" /> Custom line</Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search products by name or item no..." value={prodQuery} onChange={(e) => setProdQuery(e.target.value)} className="pl-9" />
                                    {prodMatches.length > 0 && (
                                        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-popover shadow-md">
                                            {prodMatches.map((p) => (
                                                <button key={p.id} type="button" onClick={() => addProduct(p)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted">
                                                    <span className="min-w-0"><span className="font-medium">{p.name}</span><span className="block text-xs text-muted-foreground">{p.item_no}{p.spec ? ` · ${p.spec}` : ''}</span></span>
                                                    <span className="shrink-0 tabular-nums">{inr.format(p.price)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-8">#</TableHead>
                                                <TableHead className="min-w-[200px]">Item</TableHead>
                                                <TableHead className="w-20 text-right">Qty</TableHead>
                                                <TableHead className="w-28 text-right">Unit price</TableHead>
                                                <TableHead className="w-28 text-right">Amount</TableHead>
                                                <TableHead className="w-8" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {lines.length === 0 ? (
                                                <TableRow><TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">No items yet. Search above to add products.</TableCell></TableRow>
                                            ) : lines.map((l, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                                    <TableCell>
                                                        {l.product_id ? (
                                                            <><span className="font-medium">{l.name}</span><span className="block text-xs text-muted-foreground">{l.item_no}{l.spec ? ` · ${l.spec}` : ''}{l._bulk ? ` · bulk ${l._bulk}` : ''}</span></>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <Input value={l.name} placeholder="Item name" onChange={(e) => setLine(i, { name: e.target.value })} className="h-8" />
                                                                <Input value={l.spec} placeholder="Spec / item no" onChange={(e) => setLine(i, { spec: e.target.value, item_no: e.target.value })} className="h-7 text-xs" />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right"><Input type="number" min={0} value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) || 0 })} className="h-8 text-right" /></TableCell>
                                                    <TableCell className="text-right"><Input type="number" min={0} value={l.unit_price} onChange={(e) => setLine(i, { unit_price: Number(e.target.value) || 0 })} className="h-8 text-right" /></TableCell>
                                                    <TableCell className="text-right font-medium tabular-nums">{inr.format(l.unit_price * l.qty)}</TableCell>
                                                    <TableCell><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-red-700" onClick={() => removeLine(i)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar: options + totals */}
                    <aside className="space-y-6">
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Pricing &amp; options</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5"><Label>Special discount</Label><Input type="number" min={0} value={special} onChange={(e) => setSpecial(Number(e.target.value) || 0)} /></div>
                                    <div className="space-y-1.5"><Label>Delivery fee</Label><Input type="number" min={0} value={deliveryFee} onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)} /></div>
                                </div>
                                <div className="flex items-center justify-between"><Label htmlFor="express">Express delivery</Label><Switch id="express" checked={express} onCheckedChange={setExpress} /></div>
                                <div className="space-y-1.5">
                                    <Label>GST</Label>
                                    <Select value={String(gstPct)} onValueChange={(v) => setGstPct(Number(v))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{[0, 5, 12, 18, 28].map((g) => <SelectItem key={g} value={String(g)}>{g === 0 ? 'No GST' : `${g}%`}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-between"><Label htmlFor="showPrices">Show prices</Label><Switch id="showPrices" checked={showPrices} onCheckedChange={setShowPrices} /></div>
                                <div className="flex items-center justify-between"><Label htmlFor="showScheme">Volume scheme</Label><Switch id="showScheme" checked={showScheme} onCheckedChange={setShowScheme} /></div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">PDF template</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label>Template</Label>
                                    <Select value={template} onValueChange={setTemplate}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="classic">Classic</SelectItem>
                                            <SelectItem value="bold">Bold</SelectItem>
                                            <SelectItem value="studio">Studio</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Accent colour</Label>
                                    <div className="flex items-center gap-1.5">
                                        {SWATCHES.map((c) => (
                                            <button key={c} type="button" onClick={() => setAccent(c)} style={{ backgroundColor: c }} className={cn('h-7 w-7 rounded-full border-2', accent.toUpperCase() === c ? 'border-foreground' : 'border-transparent')} aria-label={c} />
                                        ))}
                                        <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5" />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">Dealer details, fonts and logos are in <Link href="/admin/bom/settings" className="underline">Estimate settings</Link>.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Summary</CardTitle></CardHeader>
                            <CardContent className="space-y-1.5 text-sm">
                                <Row label={`Item total (${T.lineCount} · ${T.totalPcs} pcs)`} value={inr.format(T.itemTotal)} />
                                {T.schemeOff > 0 && <Row label={`Volume scheme (${T.schemePct}%)`} value={`- ${inr.format(T.schemeOff)}`} muted />}
                                {T.special > 0 && <Row label="Special discount" value={`- ${inr.format(T.special)}`} muted />}
                                <Row label={`Delivery${express ? ' (express)' : ''}`} value={T.deliveryFee === 0 ? 'FREE' : inr.format(T.deliveryFee)} muted />
                                {gstPct > 0 && <Row label="Subtotal" value={inr.format(T.subtotal)} muted />}
                                {gstPct > 0 && <Row label={`GST (${gstPct}%)`} value={inr.format(T.gstAmt)} muted />}
                                <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold">
                                    <span>{gstPct > 0 ? 'Grand total' : 'Total'}</span>
                                    <span className="tabular-nums" style={{ color: accent }}>{inr.format(T.grand)}</span>
                                </div>
                                {T.grand > 0 && <p className="pt-1 text-xs capitalize text-muted-foreground">{inrWords(T.grand)} rupees only</p>}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </AdminLayout>
    );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className={muted ? 'text-muted-foreground' : ''}>{label}</span>
            <span className="tabular-nums">{value}</span>
        </div>
    );
}
