import { useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import type { EstimateSetting } from '@/types';

interface Form {
    company_name: string;
    prepared_by: string;
    doc_title: string;
    note: string;
    terms: string;
    valid_days: number;
    template: string;
    accent: string;
    paper: string;
    font: string;
    footer_color: string;
    side_color: string;
    wordmark_color: string;
    logos_pos: string;
    photos: boolean;
    show_prices: boolean;
    show_scheme: boolean;
    use_brand_logos: boolean;
    gst_pct: number;
    watermark: string;
    dealer_addr1: string;
    dealer_addr2: string;
    dealer_phone: string;
    dealer_email: string;
    dealer_website: string;
    dealer_gstin: string;
    logo: File | null;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5" />
                <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
            </div>
        </div>
    );
}

export default function EstimateSettingsPage({ settings: s }: { settings: EstimateSetting }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing } = useForm<Form>({
        company_name: s.company_name ?? 'GC Communication',
        prepared_by: s.prepared_by ?? '',
        doc_title: s.doc_title ?? 'Bill of Materials',
        note: s.note ?? '',
        terms: s.terms ?? '',
        valid_days: s.valid_days ?? 7,
        template: s.template ?? 'classic',
        accent: s.accent ?? '#2563EB',
        paper: s.paper ?? '#FFFFFF',
        font: s.font ?? 'inter',
        footer_color: s.footer_color ?? '#696E74',
        side_color: s.side_color ?? '#696E74',
        wordmark_color: s.wordmark_color ?? '#1A1C1F',
        logos_pos: s.logos_pos ?? 'top',
        photos: s.photos ?? true,
        show_prices: s.show_prices ?? true,
        show_scheme: s.show_scheme ?? true,
        use_brand_logos: s.use_brand_logos ?? true,
        gst_pct: s.gst_pct ?? 0,
        watermark: s.watermark ?? '',
        dealer_addr1: s.dealer_addr1 ?? '',
        dealer_addr2: s.dealer_addr2 ?? '',
        dealer_phone: s.dealer_phone ?? '',
        dealer_email: s.dealer_email ?? '',
        dealer_website: s.dealer_website ?? '',
        dealer_gstin: s.dealer_gstin ?? '',
        logo: null,
    });

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post('/admin/bom/settings', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Estimate settings saved.'),
            onError: () => toast.error('Please fix the errors and try again.'),
        });
    }

    return (
        <AdminLayout breadcrumbs={[{ label: 'BOM', href: '/admin/bom' }, { label: 'Settings' }]}>
            <Head title="Estimate settings" />
            <form onSubmit={submit} className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <Button asChild variant="ghost" size="sm"><Link href="/admin/bom"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>
                    <h1 className="text-xl font-bold tracking-tight">Estimate settings</h1>
                    <Button type="submit" disabled={processing} className="ml-auto">{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save settings</Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Company &amp; dealer</CardTitle><CardDescription>Appears on the PDF letterhead and footer.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5"><Label>Company name</Label><Input value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} /></div>
                                <div className="space-y-1.5"><Label>Prepared by</Label><Input value={data.prepared_by} onChange={(e) => setData('prepared_by', e.target.value)} /></div>
                                <div className="space-y-1.5"><Label>Phone</Label><Input value={data.dealer_phone} onChange={(e) => setData('dealer_phone', e.target.value)} /></div>
                                <div className="space-y-1.5"><Label>Email</Label><Input value={data.dealer_email} onChange={(e) => setData('dealer_email', e.target.value)} /></div>
                                <div className="space-y-1.5"><Label>Address line 1</Label><Input value={data.dealer_addr1} onChange={(e) => setData('dealer_addr1', e.target.value)} /></div>
                                <div className="space-y-1.5"><Label>Address line 2</Label><Input value={data.dealer_addr2} onChange={(e) => setData('dealer_addr2', e.target.value)} /></div>
                                <div className="space-y-1.5"><Label>Website</Label><Input value={data.dealer_website} onChange={(e) => setData('dealer_website', e.target.value)} /></div>
                                <div className="space-y-1.5"><Label>GSTIN</Label><Input value={data.dealer_gstin} onChange={(e) => setData('dealer_gstin', e.target.value)} /></div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Logo</Label>
                                <div className="flex items-center gap-3">
                                    {s.logo && !data.logo && <img src={s.logo} alt="" className="h-10 w-auto rounded border border-border bg-white object-contain p-1" />}
                                    <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => setData('logo', e.target.files?.[0] ?? null)} />
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5" /> {data.logo ? data.logo.name : 'Upload logo'}</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Defaults</CardTitle><CardDescription>Starting values for new estimates.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5"><Label>Document title</Label><Input value={data.doc_title} onChange={(e) => setData('doc_title', e.target.value)} /></div>
                                <div className="space-y-1.5"><Label>Valid (days)</Label><Input type="number" min={1} value={data.valid_days} onChange={(e) => setData('valid_days', Number(e.target.value) || 7)} /></div>
                                <div className="space-y-1.5">
                                    <Label>Default template</Label>
                                    <Select value={data.template} onValueChange={(v) => setData('template', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="classic">Classic</SelectItem><SelectItem value="bold">Bold</SelectItem><SelectItem value="studio">Studio</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Font</Label>
                                    <Select value={data.font} onValueChange={(v) => setData('font', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="inter">Inter</SelectItem><SelectItem value="pjs">Plus Jakarta Sans</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Default GST</Label>
                                    <Select value={String(data.gst_pct)} onValueChange={(v) => setData('gst_pct', Number(v))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{[0, 5, 12, 18, 28].map((g) => <SelectItem key={g} value={String(g)}>{g === 0 ? 'No GST' : `${g}%`}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Dealer logos position</Label>
                                    <Select value={data.logos_pos} onValueChange={(v) => setData('logos_pos', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="top">Top</SelectItem><SelectItem value="bottom">Bottom</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center justify-between"><Label>Show prices by default</Label><Switch checked={data.show_prices} onCheckedChange={(v) => setData('show_prices', v)} /></div>
                            <div className="flex items-center justify-between"><Label>Volume scheme by default</Label><Switch checked={data.show_scheme} onCheckedChange={(v) => setData('show_scheme', v)} /></div>
                            <div className="flex items-center justify-between"><Label>Show product photos</Label><Switch checked={data.photos} onCheckedChange={(v) => setData('photos', v)} /></div>
                            <div className="flex items-center justify-between"><Label>Show brand logos (Authorized dealer for)</Label><Switch checked={data.use_brand_logos} onCheckedChange={(v) => setData('use_brand_logos', v)} /></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Colours</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <ColorField label="Accent" value={data.accent} onChange={(v) => setData('accent', v)} />
                            <ColorField label="Paper" value={data.paper} onChange={(v) => setData('paper', v)} />
                            <ColorField label="Wordmark" value={data.wordmark_color} onChange={(v) => setData('wordmark_color', v)} />
                            <ColorField label="Footer text" value={data.footer_color} onChange={(v) => setData('footer_color', v)} />
                            <ColorField label="Side text" value={data.side_color} onChange={(v) => setData('side_color', v)} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Text</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5"><Label>Footer note (use **bold** for emphasis)</Label><Textarea rows={2} value={data.note} onChange={(e) => setData('note', e.target.value)} /></div>
                            <div className="space-y-1.5"><Label>Terms &amp; conditions</Label><Textarea rows={3} value={data.terms} onChange={(e) => setData('terms', e.target.value)} /></div>
                            <div className="space-y-1.5"><Label>Watermark (optional, e.g. DRAFT)</Label><Input value={data.watermark} onChange={(e) => setData('watermark', e.target.value)} /></div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </AdminLayout>
    );
}
