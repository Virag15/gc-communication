import { useMemo, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Brand { id: number; name: string; }
const NONE = '__none__';

const FIELDS: { key: string; label: string; required?: boolean }[] = [
    { key: 'item_no', label: 'Item no / SKU', required: true },
    { key: 'name', label: 'Name / Description', required: true },
    { key: 'spec', label: 'Spec / Rating' },
    { key: 'price', label: 'Price (selling)' },
    { key: 'mrp', label: 'MRP' },
    { key: 'category', label: 'Category / Series' },
    { key: 'image', label: 'Image URL' },
];

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');
const toNum = (v: unknown): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : null;
};

function guessMapping(headers: string[]): Record<string, number> {
    const m: Record<string, number> = {};
    headers.forEach((h, i) => {
        const n = norm(h);
        if (m.item_no === undefined && /(itemno|item|sku|code|catno|cat|partno|part|article|model| refno)/.test(n)) m.item_no = i;
        else if (m.name === undefined && /(name|description|desc|product|particular|item)/.test(n)) m.name = i;
        if (m.mrp === undefined && /(mrp|listprice|list)/.test(n)) m.mrp = i;
        else if (m.price === undefined && /(price|rate|dp|net|dealer)/.test(n)) m.price = i;
        if (m.spec === undefined && /(spec|rating|rated|technical|amp|pole)/.test(n)) m.spec = i;
        if (m.category === undefined && /(category|group|type|series|range)/.test(n)) m.category = i;
        if (m.image === undefined && /(image|photo|picture|img|thumbnail)/.test(n)) m.image = i;
    });
    return m;
}

export default function ProductImport({ brands }: { brands: Brand[] }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [brandId, setBrandId] = useState<string>(NONE);
    const [fileName, setFileName] = useState('');
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, number>>({});
    const [importing, setImporting] = useState(false);

    const applyParsed = (hdr: string[], body: string[][]) => {
        setHeaders(hdr);
        setRows(body);
        setMapping(guessMapping(hdr));
    };

    const handleFile = async (file: File) => {
        if (/\.pdf$/i.test(file.name)) {
            toast.error('Brand PDFs can’t be read directly — convert the PDF to a CSV first with the price-list converter (tools/pricelist-ocr), then upload that CSV here.');
            return;
        }
        setFileName(file.name);
        try {
            const data = new Uint8Array(await file.arrayBuffer());
            const wb = XLSX.read(data, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: '' });
            if (!aoa.length) { toast.error('That file looks empty.'); return; }
            const hdr = (aoa[0] as unknown[]).map((c) => String(c ?? '').trim());
            const body = aoa.slice(1).map((r) => (r as unknown[]).map((c) => String(c ?? '')));
            applyParsed(hdr, body);
        } catch {
            toast.error('Could not read that file. Please upload a .csv or .xlsx.');
        }
    };

    const setField = (key: string, val: string) => {
        setMapping((m) => {
            const next = { ...m };
            if (val === NONE) delete next[key];
            else next[key] = Number(val);
            return next;
        });
    };

    const built = useMemo(() => {
        if (mapping.item_no === undefined || mapping.name === undefined) return [];
        return rows
            .map((r) => ({
                item_no: String(r[mapping.item_no] ?? '').trim(),
                name: String(r[mapping.name] ?? '').trim(),
                spec: mapping.spec !== undefined ? String(r[mapping.spec] ?? '').trim() : undefined,
                price: mapping.price !== undefined ? toNum(r[mapping.price]) : undefined,
                mrp: mapping.mrp !== undefined ? toNum(r[mapping.mrp]) : undefined,
                category: mapping.category !== undefined ? String(r[mapping.category] ?? '').trim() : undefined,
                image: mapping.image !== undefined ? String(r[mapping.image] ?? '').trim() : undefined,
            }))
            .filter((x) => x.item_no && x.name);
    }, [rows, mapping]);

    const ready = mapping.item_no !== undefined && mapping.name !== undefined && built.length > 0;

    const doImport = () => {
        if (!ready) return toast.error('Map at least Item no and Name.');
        setImporting(true);
        router.post('/admin/products/import', { brand_id: brandId === NONE ? null : Number(brandId), rows: built }, {
            // Success toast comes from the server flash ("X added, Y updated").
            onError: () => toast.error('Import failed. Check the file and mapping.'),
            onFinish: () => setImporting(false),
        });
    };

    return (
        <AdminLayout breadcrumbs={[{ label: 'Products', href: '/admin/products' }, { label: 'Import' }]}>
            <Head title="Import products" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <Button asChild variant="ghost" size="sm"><Link href="/admin/products"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>
                    <h1 className="text-xl font-bold tracking-tight">Import products</h1>
                    <Button type="button" onClick={doImport} disabled={!ready || importing} className="ml-auto">
                        {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                        Import {built.length > 0 ? `${built.length} rows` : ''}
                    </Button>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">1. Brand &amp; file</CardTitle>
                        <CardDescription>Upload the brand's price list as <strong>.csv</strong> or <strong>.xlsx</strong> (first row = column headers). Manufacturer PDFs must be converted to CSV first with the price-list converter (tools/pricelist-ocr).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Brand</Label>
                                <Select value={brandId} onValueChange={setBrandId}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE}>No brand / General</SelectItem>
                                        {brands.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Price list file</Label>
                                <div className="flex items-center gap-2">
                                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                                    <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Choose file</Button>
                                    {fileName && <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><FileSpreadsheet className="h-4 w-4" /> {fileName}</span>}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {headers.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">2. Map columns</CardTitle>
                            <CardDescription>Match your file's columns to product fields. We guessed where we could.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {FIELDS.map((field) => (
                                <div key={field.key} className="space-y-1.5">
                                    <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
                                    <Select value={mapping[field.key] !== undefined ? String(mapping[field.key]) : NONE} onValueChange={(v) => setField(field.key, v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE}>{field.required ? 'Select a column' : 'Not mapped'}</SelectItem>
                                            {headers.map((h, i) => <SelectItem key={i} value={String(i)}>{h || `Column ${i + 1}`}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {ready && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">3. Preview</CardTitle>
                            <CardDescription>{built.length} valid rows. Showing the first 10. Existing items (same brand + item no) are updated.</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">Img</TableHead>
                                        <TableHead>Item no</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Spec</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">MRP</TableHead>
                                        <TableHead>Category</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {built.slice(0, 10).map((r, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                {r.image ? (
                                                    <img src={r.image} alt="" className="h-8 w-8 rounded border border-border object-contain" />
                                                ) : (
                                                    <div className="h-8 w-8 rounded border border-dashed border-border" />
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{r.item_no}</TableCell>
                                            <TableCell>{r.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{r.spec || '-'}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.price ?? '-'}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.mrp ?? '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{r.category || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
