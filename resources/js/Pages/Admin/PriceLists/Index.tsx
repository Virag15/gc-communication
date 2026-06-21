import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Loader2, Play, RefreshCw, CheckCircle2, Database } from 'lucide-react';

interface Brand { id: number; name: string; }
interface Progress { page: number; total: number; rows: number; }
interface FileStatus { state: 'idle' | 'running' | 'done'; progress: Progress | null; rows: number | null; hasCsv: boolean; }
interface PriceFile extends FileStatus { name: string; sizeMb: number; }

const NONE = '__none__';

function guessBrand(name: string, brands: Brand[]): string {
    const n = name.toLowerCase();
    const hit = brands.find((b) => {
        const key = b.name.toLowerCase().split(/\s|&/)[0];
        return key.length > 1 && n.includes(key);
    });
    return hit ? String(hit.id) : NONE;
}

export default function PriceLists({ files, brands, available }: { files: PriceFile[]; brands: Brand[]; available: boolean }) {
    const [statuses, setStatuses] = useState<Record<string, FileStatus>>(
        () => Object.fromEntries(files.map((f) => [f.name, { state: f.state, progress: f.progress, rows: f.rows, hasCsv: f.hasCsv }])),
    );
    const [brandSel, setBrandSel] = useState<Record<string, string>>(
        () => Object.fromEntries(files.map((f) => [f.name, guessBrand(f.name, brands)])),
    );
    const [busy, setBusy] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);

    const anyRunning = useMemo(() => Object.values(statuses).some((s) => s.state === 'running'), [statuses]);

    // Poll the status endpoint while any conversion is running.
    useEffect(() => {
        if (!anyRunning) { if (timer.current) { clearInterval(timer.current); timer.current = null; } return; }
        if (timer.current) return;
        const poll = async () => {
            const names = files.map((f) => f.name);
            const qs = names.map((n) => `names[]=${encodeURIComponent(n)}`).join('&');
            try {
                const res = await fetch(`/admin/price-lists/status?${qs}`, { headers: { Accept: 'application/json' } });
                if (res.ok) { const data = await res.json(); setStatuses((prev) => ({ ...prev, ...data })); }
            } catch { /* ignore transient poll errors */ }
        };
        timer.current = setInterval(poll, 3500);
        poll();
        return () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };
    }, [anyRunning, files]);

    const convert = (name: string) => {
        setBusy(name);
        setStatuses((s) => ({ ...s, [name]: { ...s[name], state: 'running', progress: null } }));
        router.post('/admin/price-lists/convert', { name }, { preserveScroll: true, onFinish: () => setBusy(null) });
    };

    const doImport = (name: string) => {
        setBusy(name);
        const brand_id = brandSel[name] === NONE ? null : Number(brandSel[name]);
        router.post('/admin/price-lists/import', { name, brand_id }, { preserveScroll: true, onFinish: () => setBusy(null) });
    };

    return (
        <AdminLayout breadcrumbs={[{ label: 'Products', href: '/admin/products' }, { label: 'Price lists' }]}>
            <Head title="Price lists" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Price lists</h1>
                    <p className="text-sm text-muted-foreground">
                        Convert a manufacturer's PDF price list to a catalogue, then import it — photos included. Runs locally on this Mac.
                    </p>
                </div>

                {!available && (
                    <Card><CardContent className="py-6 text-sm text-muted-foreground">
                        No <code>price-list/</code> folder found. Put the brand PDFs in a <code>price-list</code> folder at the project root, then reload.
                    </CardContent></Card>
                )}

                {available && files.length === 0 && (
                    <Card><CardContent className="py-6 text-sm text-muted-foreground">
                        No PDFs in the <code>price-list/</code> folder yet. Drop the brand price-list PDFs there and reload.
                    </CardContent></Card>
                )}

                <div className="grid gap-4">
                    {files.map((f) => {
                        const st = statuses[f.name] ?? { state: f.state, progress: f.progress, rows: f.rows, hasCsv: f.hasCsv };
                        const running = st.state === 'running';
                        const pct = running && st.progress?.total ? Math.round((st.progress.page / st.progress.total) * 100) : 0;
                        return (
                            <Card key={f.name}>
                                <CardHeader className="pb-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                <span className="truncate">{f.name}</span>
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {f.sizeMb} MB
                                                {st.hasCsv && st.rows != null && <> · <span className="text-foreground">{st.rows.toLocaleString()} rows ready</span></>}
                                            </CardDescription>
                                        </div>
                                        {running ? (
                                            <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Converting</Badge>
                                        ) : st.hasCsv ? (
                                            <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" /> Ready</Badge>
                                        ) : (
                                            <Badge variant="outline">Not converted</Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {running && (
                                        <div className="space-y-1.5">
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {st.progress ? `OCR ${st.progress.page}/${st.progress.total} pages · ${st.progress.rows.toLocaleString()} rows` : 'Starting…'}
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button variant="outline" size="sm" disabled={running || busy === f.name} onClick={() => convert(f.name)}>
                                            {busy === f.name && !running ? <Loader2 className="h-4 w-4 animate-spin" /> : st.hasCsv ? <RefreshCw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                            {st.hasCsv ? 'Re-convert' : 'Convert'}
                                        </Button>

                                        {st.hasCsv && (
                                            <>
                                                <div className="ml-auto flex items-center gap-2">
                                                    <Select value={brandSel[f.name] ?? NONE} onValueChange={(v) => setBrandSel((b) => ({ ...b, [f.name]: v }))}>
                                                        <SelectTrigger className="h-9 w-52"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value={NONE}>No brand / General</SelectItem>
                                                            {brands.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button size="sm" disabled={busy === f.name || running} onClick={() => doImport(f.name)}>
                                                        {busy === f.name && !running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                                                        Import to catalogue
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AdminLayout>
    );
}
