import { useEffect, useMemo, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Image as ImageIcon, Upload, Save } from 'lucide-react';

interface SettingsIndexProps {
    settings: Record<string, string | null>;
    appUrl: string;
}

interface SettingsForm {
    gtm_id: string;
    ga4_id: string;
    meta_pixel_id: string;
    google_site_verification: string;
    bing_site_verification: string;
    site_name: string;
    default_meta_title: string;
    default_meta_description: string;
    default_og_image: File | null;
    org_logo: File | null;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    social_facebook: string;
    social_instagram: string;
    social_linkedin: string;
    hero_eyebrow: string;
    hero_headline: string;
    hero_subtext: string;
    hero_image: File | null;
    stat_years: string;
    stat_lines: string;
    stat_orders: string;
    stat_fill_rate: string;
    locations: string;
    since_year: string;
    custom_head_html: string;
    custom_body_html: string;
    consent_enabled: boolean;
}

type TextKey = {
    [K in keyof SettingsForm]: SettingsForm[K] extends string ? K : never;
}[keyof SettingsForm];

interface FieldProps {
    id: TextKey;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    hint?: string;
    error?: string;
    type?: string;
}

function Field({ id, label, value, onChange, placeholder, hint, error, type = 'text' }: FieldProps) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

interface ImageFieldProps {
    id: string;
    label: string;
    currentUrl: string | null;
    file: File | null;
    onSelect: (file: File | null) => void;
    hint?: string;
    error?: string;
}

function ImageField({ id, label, currentUrl, file, onSelect, hint, error }: ImageFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const preview = useMemo(() => (file ? URL.createObjectURL(file) : currentUrl), [file, currentUrl]);
    useEffect(() => {
        return () => {
            if (file && preview) URL.revokeObjectURL(preview);
        };
    }, [file, preview]);

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                    {preview ? (
                        <img src={preview} alt="" className="h-full w-full object-contain" />
                    ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                </div>
                <div className="min-w-0 space-y-1.5">
                    <input ref={inputRef} id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => onSelect(e.target.files?.[0] ?? null)} />
                    <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5" />
                        {file || currentUrl ? 'Change image' : 'Upload image'}
                    </Button>
                    <p className="truncate text-xs text-muted-foreground">
                        {file ? file.name : currentUrl ? 'Current image set' : 'PNG, JPG or WebP'}
                    </p>
                </div>
            </div>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function StatusBadge({ label, on }: { label: string; on: boolean }) {
    return <Badge variant={on ? 'default' : 'secondary'}>{label}{on ? '' : ' · off'}</Badge>;
}

export default function SettingsIndex({ settings, appUrl }: SettingsIndexProps) {
    const s = (key: TextKey): string => settings[key] ?? '';

    const { data, setData, post, processing, errors } = useForm<SettingsForm>({
        gtm_id: s('gtm_id'),
        ga4_id: s('ga4_id'),
        meta_pixel_id: s('meta_pixel_id'),
        google_site_verification: s('google_site_verification'),
        bing_site_verification: s('bing_site_verification'),
        site_name: s('site_name'),
        default_meta_title: s('default_meta_title'),
        default_meta_description: s('default_meta_description'),
        default_og_image: null,
        org_logo: null,
        contact_email: s('contact_email'),
        contact_phone: s('contact_phone'),
        contact_address: s('contact_address'),
        social_facebook: s('social_facebook'),
        social_instagram: s('social_instagram'),
        social_linkedin: s('social_linkedin'),
        hero_eyebrow: s('hero_eyebrow'),
        hero_headline: s('hero_headline'),
        hero_subtext: s('hero_subtext'),
        hero_image: null,
        stat_years: s('stat_years'),
        stat_lines: s('stat_lines'),
        stat_orders: s('stat_orders'),
        stat_fill_rate: s('stat_fill_rate'),
        locations: s('locations'),
        since_year: s('since_year'),
        custom_head_html: s('custom_head_html'),
        custom_body_html: s('custom_body_html'),
        consent_enabled: settings.consent_enabled === '1' || settings.consent_enabled === 'true',
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post('/admin/settings', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setData('default_og_image', null);
                setData('org_logo', null);
                setData('hero_image', null);
                toast.success('Site settings saved.');
            },
            onError: () => toast.error('Please fix the errors and try again.'),
        });
    }

    // ----- Live preview values -----
    const host = appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const previewTitle = data.default_meta_title || data.site_name || 'GC Communication';
    const previewDescription = data.default_meta_description;

    const ogPreview = useMemo(() => {
        if (data.default_og_image) return URL.createObjectURL(data.default_og_image);
        if (settings.default_og_image) return settings.default_og_image;
        if (data.org_logo) return URL.createObjectURL(data.org_logo);
        return settings.org_logo ?? null;
    }, [data.default_og_image, data.org_logo, settings.default_og_image, settings.org_logo]);

    useEffect(() => {
        return () => {
            if (ogPreview?.startsWith('blob:')) URL.revokeObjectURL(ogPreview);
        };
    }, [ogPreview]);

    return (
        <AdminLayout breadcrumbs={[{ label: 'Site Settings' }]}>
            <Head title="Site Settings" />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Site Settings</h1>
                    <Button type="submit" disabled={processing}>
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    {/* Form */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tracking &amp; Analytics</CardTitle>
                                <CardDescription>
                                    Prefer Google Tag Manager - you can load GA4, Meta Pixel, Google Ads and more inside it.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <Field id="gtm_id" label="Google Tag Manager ID" value={data.gtm_id} onChange={(v) => setData('gtm_id', v)} placeholder="GTM-XXXXXXX" error={errors.gtm_id} />
                                <Field id="ga4_id" label="Google Analytics 4 ID" value={data.ga4_id} onChange={(v) => setData('ga4_id', v)} placeholder="G-XXXXXXXXXX" error={errors.ga4_id} />
                                <Field id="meta_pixel_id" label="Meta Pixel ID" value={data.meta_pixel_id} onChange={(v) => setData('meta_pixel_id', v)} placeholder="123456789012345" error={errors.meta_pixel_id} />
                                <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground sm:col-span-2">
                                    <p className="font-semibold text-foreground">How to find these IDs</p>
                                    <p><span className="font-medium text-foreground">GTM:</span> tagmanager.google.com to your container; the ID at the top reads GTM-XXXXXXX.</p>
                                    <p><span className="font-medium text-foreground">GA4:</span> analytics.google.com to Admin to Data streams to your web stream to Measurement ID (G-XXXXXXXXXX).</p>
                                    <p><span className="font-medium text-foreground">Meta Pixel:</span> business.facebook.com to Events Manager to Data sources to your pixel; copy the numeric Pixel ID.</p>
                                    <p>Paste just the ID, not the script. It is injected on every public page automatically. Tip: route GA4 and the Pixel through GTM and you only need the GTM ID.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Search-engine Verification</CardTitle>
                                <CardDescription>Verification codes for Google Search Console and Bing Webmaster Tools.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <Field id="google_site_verification" label="Google verification" value={data.google_site_verification} onChange={(v) => setData('google_site_verification', v)} placeholder="content value of the meta tag" error={errors.google_site_verification} />
                                <Field id="bing_site_verification" label="Bing verification" value={data.bing_site_verification} onChange={(v) => setData('bing_site_verification', v)} placeholder="content value of the meta tag" error={errors.bing_site_verification} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>SEO Defaults</CardTitle>
                                <CardDescription>Fallback metadata used on pages that don&apos;t set their own.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <Field id="site_name" label="Site name" value={data.site_name} onChange={(v) => setData('site_name', v)} placeholder="GC Communication" error={errors.site_name} />
                                <ImageField id="default_og_image" label="Default social image" currentUrl={settings.default_og_image ?? null} file={data.default_og_image} onSelect={(f) => setData('default_og_image', f)} hint="Shown when pages are shared (1200×630 recommended)." error={errors.default_og_image} />
                                <div className="sm:col-span-2">
                                    <Field id="default_meta_title" label="Default meta title" value={data.default_meta_title} onChange={(v) => setData('default_meta_title', v)} placeholder="GC Communication - Electrical Distribution" hint={`${data.default_meta_title.length}/70 characters`} error={errors.default_meta_title} />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="default_meta_description">Default meta description</Label>
                                    <Textarea id="default_meta_description" rows={2} value={data.default_meta_description} onChange={(e) => setData('default_meta_description', e.target.value)} placeholder="Brief description shown in search results." />
                                    <p className="text-xs text-muted-foreground">{data.default_meta_description.length}/200 characters</p>
                                    {errors.default_meta_description && <p className="text-xs text-destructive">{errors.default_meta_description}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Homepage hero</CardTitle>
                                <CardDescription>The top banner of the public website.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <Field id="hero_eyebrow" label="Eyebrow / tagline" value={data.hero_eyebrow} onChange={(v) => setData('hero_eyebrow', v)} placeholder="Authorised low-voltage switchgear distributor" error={errors.hero_eyebrow} />
                                <ImageField id="hero_image" label="Hero background image" currentUrl={settings.hero_image ?? null} file={data.hero_image} onSelect={(f) => setData('hero_image', f)} hint="A wide warehouse or counter photo works best." error={errors.hero_image} />
                                <div className="sm:col-span-2">
                                    <Field id="hero_headline" label="Headline" value={data.hero_headline} onChange={(v) => setData('hero_headline', v)} placeholder="The right switchgear on the shelf, and out the same day." error={errors.hero_headline} />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="hero_subtext">Sub-text</Label>
                                    <Textarea id="hero_subtext" rows={2} value={data.hero_subtext} onChange={(e) => setData('hero_subtext', e.target.value)} placeholder="Short supporting sentence under the headline." />
                                    {errors.hero_subtext && <p className="text-xs text-destructive">{errors.hero_subtext}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Headline stats</CardTitle>
                                <CardDescription>The numbers shown in the momentum band on the homepage.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <Field id="stat_years" label="Years in trade" value={data.stat_years} onChange={(v) => setData('stat_years', v)} placeholder="13" error={errors.stat_years} />
                                <Field id="since_year" label="Operating since (year)" value={data.since_year} onChange={(v) => setData('since_year', v)} placeholder="2013" error={errors.since_year} />
                                <Field id="stat_lines" label="Lines held in stock" value={data.stat_lines} onChange={(v) => setData('stat_lines', v)} placeholder="2,100+" error={errors.stat_lines} />
                                <Field id="stat_orders" label="Orders dispatched" value={data.stat_orders} onChange={(v) => setData('stat_orders', v)} placeholder="25k+" error={errors.stat_orders} />
                                <Field id="stat_fill_rate" label="Order fill rate" value={data.stat_fill_rate} onChange={(v) => setData('stat_fill_rate', v)} placeholder="98%" error={errors.stat_fill_rate} />
                                <Field id="locations" label="Locations" value={data.locations} onChange={(v) => setData('locations', v)} placeholder="Nashik & Jalgaon" error={errors.locations} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Organization &amp; Contact</CardTitle>
                                <CardDescription>Used in the footer and in structured data (JSON-LD) for SEO.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <ImageField id="org_logo" label="Organization logo" currentUrl={settings.org_logo ?? null} file={data.org_logo} onSelect={(f) => setData('org_logo', f)} hint="SVG, PNG or WebP. Falls back to the bundled GC logo." error={errors.org_logo} />
                                <Field id="contact_email" label="Contact email" type="email" value={data.contact_email} onChange={(v) => setData('contact_email', v)} placeholder="info@gc-communication.in" error={errors.contact_email} />
                                <Field id="contact_phone" label="Contact phone" value={data.contact_phone} onChange={(v) => setData('contact_phone', v)} placeholder="+91 ..." error={errors.contact_phone} />
                                <Field id="social_facebook" label="Facebook URL" value={data.social_facebook} onChange={(v) => setData('social_facebook', v)} placeholder="https://facebook.com/..." error={errors.social_facebook} />
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="contact_address">Address</Label>
                                    <Textarea id="contact_address" rows={2} value={data.contact_address} onChange={(e) => setData('contact_address', e.target.value)} placeholder="Street, City, State, PIN" />
                                    {errors.contact_address && <p className="text-xs text-destructive">{errors.contact_address}</p>}
                                </div>
                                <Field id="social_instagram" label="Instagram URL" value={data.social_instagram} onChange={(v) => setData('social_instagram', v)} placeholder="https://instagram.com/..." error={errors.social_instagram} />
                                <Field id="social_linkedin" label="LinkedIn URL" value={data.social_linkedin} onChange={(v) => setData('social_linkedin', v)} placeholder="https://linkedin.com/company/..." error={errors.social_linkedin} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Privacy &amp; Consent</CardTitle>
                                <CardDescription>Show a cookie-consent banner and load analytics with Google Consent Mode.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <Label htmlFor="consent_enabled">Cookie-consent banner</Label>
                                        <p className="text-xs text-muted-foreground">Recommended if you receive visitors from the EU/UK.</p>
                                    </div>
                                    <Switch id="consent_enabled" checked={data.consent_enabled} onCheckedChange={(v) => setData('consent_enabled', v)} />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing}>
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save settings
                            </Button>
                        </div>
                    </div>

                    {/* Live preview */}
                    <aside>
                        <div className="space-y-4 lg:sticky lg:top-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Live preview</p>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Google result</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <p className="truncate text-xs text-muted-foreground">{host}</p>
                                    <p className="truncate text-[15px] leading-snug text-[#1a0dab] dark:text-blue-400">{previewTitle}</p>
                                    <p className="line-clamp-2 text-xs text-muted-foreground">
                                        {previewDescription || 'Add a meta description to preview it here.'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden p-0">
                                <div className="flex aspect-[1.91/1] items-center justify-center overflow-hidden bg-muted">
                                    {ogPreview ? (
                                        <img src={ogPreview} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-muted-foreground">No social image</span>
                                    )}
                                </div>
                                <div className="space-y-1 p-3">
                                    <p className="truncate text-[10px] uppercase text-muted-foreground">{host}</p>
                                    <p className="truncate text-sm font-semibold leading-snug">{previewTitle}</p>
                                    <p className="line-clamp-2 text-xs text-muted-foreground">{previewDescription}</p>
                                </div>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Tracking</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-1.5">
                                    <StatusBadge label="GTM" on={!!data.gtm_id} />
                                    <StatusBadge label="GA4" on={!!data.ga4_id} />
                                    <StatusBadge label="Meta Pixel" on={!!data.meta_pixel_id} />
                                    <StatusBadge label="Consent" on={data.consent_enabled} />
                                </CardContent>
                            </Card>
                        </div>
                    </aside>
                </div>
            </form>
        </AdminLayout>
    );
}
