import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Upload, Image as ImageIcon, RefreshCw, X } from 'lucide-react';
import { type SeoSetting } from '@/types';

interface PageMeta {
    identifier: string;
    label: string;
}

interface SitemapInfo {
    exists: boolean;
    last_generated: string | null;
    url: string;
}

interface SeoIndexProps {
    seoSettings: Record<string, SeoSetting>;
    pages: PageMeta[];
    sitemapInfo: SitemapInfo;
    appUrl: string;
}

interface PageForm {
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    og_title: string;
    og_description: string;
    og_type: string;
    canonical_url: string;
    structured_data: string;
    robots: string;
    og_image: File | null;
}

const ROBOTS_OPTIONS = ['index, follow', 'noindex, follow', 'index, nofollow', 'noindex, nofollow'];

interface PagesForm {
    pages: Record<string, PageForm>;
}

function toForm(s: SeoSetting | undefined): PageForm {
    const kw = s?.meta_keywords;
    return {
        meta_title: (s?.meta_title as string | null) ?? '',
        meta_description: (s?.meta_description as string | null) ?? '',
        meta_keywords: Array.isArray(kw) ? kw.join(', ') : ((kw as string | null) ?? ''),
        og_title: s?.og_title ?? '',
        og_description: s?.og_description ?? '',
        og_type: s?.og_type ?? 'website',
        canonical_url: s?.canonical_url ?? '',
        structured_data: s?.structured_data ?? '',
        robots: s?.robots ?? (s?.noindex ? 'noindex, nofollow' : 'index, follow'),
        og_image: null,
    };
}

/** Chip-style keyword editor: type and press Enter/comma to add a tag. */
function KeywordsInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [draft, setDraft] = useState('');
    const chips = value.split(',').map((s) => s.trim()).filter(Boolean);

    const commit = (raw: string) => {
        const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
        if (!parts.length) return;
        const next = Array.from(new Set([...chips, ...parts]));
        onChange(next.join(', '));
        setDraft('');
    };
    const removeAt = (i: number) => onChange(chips.filter((_, idx) => idx !== i).join(', '));

    return (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring">
            {chips.map((c, i) => (
                <span key={`${c}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {c}
                    <button type="button" onClick={() => removeAt(i)} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${c}`}>
                        <X className="h-3 w-3" />
                    </button>
                </span>
            ))}
            <input
                value={draft}
                onChange={(e) => {
                    const v = e.target.value;
                    if (v.includes(',')) commit(v);
                    else setDraft(v);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        commit(draft);
                    } else if (e.key === 'Backspace' && !draft && chips.length) {
                        removeAt(chips.length - 1);
                    }
                }}
                onBlur={() => commit(draft)}
                placeholder={chips.length ? '' : 'Type a keyword, press Enter'}
                className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
        </div>
    );
}

export default function SeoIndex({ seoSettings, pages, sitemapInfo, appUrl }: SeoIndexProps) {
    const initial = useMemo<Record<string, PageForm>>(() => {
        const out: Record<string, PageForm> = {};
        for (const p of pages) out[p.identifier] = toForm(seoSettings[p.identifier]);
        return out;
    }, [pages, seoSettings]);

    const { data, setData, post, processing, errors } = useForm<PagesForm>({ pages: initial });
    const [active, setActive] = useState(pages[0]?.identifier ?? 'home');
    const fileRef = useRef<HTMLInputElement>(null);

    const f = data.pages[active];
    const E = errors as unknown as Record<string, string>;
    const errFor = (field: string) => E[`pages.${active}.${field}`];

    const update = (field: keyof PageForm, value: string | boolean | File | null) => {
        setData('pages', { ...data.pages, [active]: { ...data.pages[active], [field]: value } });
    };

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post('/admin/seo', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => toast.success('SEO settings saved.'),
            onError: () => toast.error('Please fix the errors and try again.'),
        });
    }

    const activeLabel = pages.find((p) => p.identifier === active)?.label ?? active;
    const host = appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const previewUrl = `https://${host}${active === 'home' ? '/' : `/${active}`}`;
    const previewTitle = f.meta_title || activeLabel;
    const previewDesc = f.meta_description || 'No description set.';
    const socialTitle = f.og_title || f.meta_title || activeLabel;
    const socialDesc = f.og_description || f.meta_description || 'No description set.';
    const ogStored = seoSettings[active]?.og_image ?? null;
    const ogPreview = useMemo(() => (f.og_image ? URL.createObjectURL(f.og_image) : ogStored), [f.og_image, ogStored]);
    useEffect(() => () => { if (ogPreview?.startsWith('blob:')) URL.revokeObjectURL(ogPreview); }, [ogPreview]);

    return (
        <AdminLayout breadcrumbs={[{ label: 'SEO' }]}>
            <Head title="SEO" />
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap gap-1 rounded-full bg-muted p-1">
                        {pages.map((p) => (
                            <button
                                type="button"
                                key={p.identifier}
                                onClick={() => setActive(p.identifier)}
                                className={cn(
                                    'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                                    active === p.identifier ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <Button type="submit" disabled={processing} className="ml-auto">
                        {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save all
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    {/* Editor */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="meta_title">Meta Title</Label>
                            <Input id="meta_title" value={f.meta_title} onChange={(e) => update('meta_title', e.target.value)} placeholder="Page title for search engines" />
                            <p className="text-xs text-muted-foreground">{f.meta_title.length}/60</p>
                            {errFor('meta_title') && <p className="text-xs text-destructive">{errFor('meta_title')}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="meta_description">Meta Description</Label>
                            <Textarea id="meta_description" rows={3} value={f.meta_description} onChange={(e) => update('meta_description', e.target.value)} placeholder="Brief description" />
                            <p className="text-xs text-muted-foreground">{f.meta_description.length}/160</p>
                            {errFor('meta_description') && <p className="text-xs text-destructive">{errFor('meta_description')}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Meta Keywords</Label>
                            <KeywordsInput value={f.meta_keywords} onChange={(v) => update('meta_keywords', v)} />
                            <p className="text-xs text-muted-foreground">Separated automatically. Press Enter or comma to add.</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="og_title">OG Title</Label>
                                <Input id="og_title" value={f.og_title} onChange={(e) => update('og_title', e.target.value)} placeholder="Social sharing title" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="og_description">OG Description</Label>
                                <Input id="og_description" value={f.og_description} onChange={(e) => update('og_description', e.target.value)} placeholder="Social sharing description" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>OG Image</Label>
                            <div className="flex items-center gap-3">
                                <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                                    {ogPreview ? <img src={ogPreview} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                                </div>
                                <div className="space-y-1.5">
                                    <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => update('og_image', e.target.files?.[0] ?? null)} />
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                                        <Upload className="h-3.5 w-3.5" />
                                        {f.og_image || ogStored ? 'Change image' : 'Upload OG image'}
                                    </Button>
                                    <p className="truncate text-xs text-muted-foreground">{f.og_image ? f.og_image.name : ogStored ? 'Current image' : '1200x630 recommended'}</p>
                                </div>
                            </div>
                            {errFor('og_image') && <p className="text-xs text-destructive">{errFor('og_image')}</p>}
                        </div>

                        <div className="space-y-4 rounded-xl border border-border p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Advanced</p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="og_type">OG type</Label>
                                    <Select value={f.og_type} onValueChange={(v) => update('og_type', v)}>
                                        <SelectTrigger id="og_type"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="website">website</SelectItem>
                                            <SelectItem value="article">article</SelectItem>
                                            <SelectItem value="product">product</SelectItem>
                                            <SelectItem value="profile">profile</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="canonical_url">Canonical URL</Label>
                                    <Input id="canonical_url" value={f.canonical_url} onChange={(e) => update('canonical_url', e.target.value)} placeholder="https://gc-communication.in/..." />
                                    {errFor('canonical_url') && <p className="text-xs text-destructive">{errFor('canonical_url')}</p>}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="structured_data">Structured data (JSON-LD)</Label>
                                <Textarea id="structured_data" rows={3} className="font-mono text-xs" value={f.structured_data} onChange={(e) => update('structured_data', e.target.value)} placeholder='{"@context":"https://schema.org", ...}' />
                                {errFor('structured_data') && <p className="text-xs text-destructive">{errFor('structured_data')}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="robots">Robots (search engine indexing)</Label>
                                <Select value={f.robots} onValueChange={(v) => update('robots', v)}>
                                    <SelectTrigger id="robots"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ROBOTS_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">"index, follow" lets search engines list this page; indexable pages also get max-image-preview/snippet hints.</p>
                            </div>
                            <p className="text-xs text-muted-foreground">Favicon is set globally in Site Settings.</p>
                        </div>
                    </div>

                    {/* Live preview */}
                    <aside>
                        <div className="space-y-4 lg:sticky lg:top-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Google preview</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <p className="truncate text-xs text-muted-foreground">{previewUrl}</p>
                                    <p className="truncate text-[15px] leading-snug text-[#1a0dab] dark:text-blue-400">{previewTitle}</p>
                                    <p className="line-clamp-2 text-xs text-muted-foreground">{previewDesc}</p>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden p-0">
                                <CardHeader className="px-4 pt-4 pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Social preview</CardTitle>
                                </CardHeader>
                                <div className="flex aspect-[1.91/1] items-center justify-center overflow-hidden bg-muted">
                                    {ogPreview ? <img src={ogPreview} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-muted-foreground">OG Image</span>}
                                </div>
                                <div className="space-y-1 p-3">
                                    <p className="truncate text-[10px] uppercase text-muted-foreground">{host}</p>
                                    <p className="truncate text-sm font-semibold leading-snug">{socialTitle}</p>
                                    <p className="line-clamp-2 text-xs text-muted-foreground">{socialDesc}</p>
                                </div>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sitemap</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                        {sitemapInfo.exists ? `Last generated ${sitemapInfo.last_generated}` : 'Not generated yet.'}
                                    </p>
                                    <Button type="button" variant="outline" size="sm" onClick={() => router.post('/admin/seo/sitemap/regenerate', {}, { preserveScroll: true, onSuccess: () => toast.success('Sitemap regenerated.') })}>
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        Regenerate sitemap
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </aside>
                </div>
            </form>
        </AdminLayout>
    );
}
