import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SettingsIndexProps {
    settings: Record<string, string | null>;
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
    default_og_image: string;
    org_logo: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    social_facebook: string;
    social_instagram: string;
    social_linkedin: string;
    consent_enabled: boolean;
}

interface FieldProps {
    id: keyof SettingsForm;
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
            <Input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

export default function SettingsIndex({ settings }: SettingsIndexProps) {
    const s = (key: keyof SettingsForm): string => settings[key] ?? '';

    const { data, setData, put, processing, errors } = useForm<SettingsForm>({
        gtm_id: s('gtm_id'),
        ga4_id: s('ga4_id'),
        meta_pixel_id: s('meta_pixel_id'),
        google_site_verification: s('google_site_verification'),
        bing_site_verification: s('bing_site_verification'),
        site_name: s('site_name'),
        default_meta_title: s('default_meta_title'),
        default_meta_description: s('default_meta_description'),
        default_og_image: s('default_og_image'),
        org_logo: s('org_logo'),
        contact_email: s('contact_email'),
        contact_phone: s('contact_phone'),
        contact_address: s('contact_address'),
        social_facebook: s('social_facebook'),
        social_instagram: s('social_instagram'),
        social_linkedin: s('social_linkedin'),
        consent_enabled: settings.consent_enabled === '1' || settings.consent_enabled === 'true',
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        put('/admin/settings', {
            preserveScroll: true,
            onSuccess: () => toast.success('Site settings saved.'),
            onError: () => toast.error('Please fix the errors and try again.'),
        });
    }

    return (
        <AdminLayout breadcrumbs={[{ label: 'Site Settings' }]}>
            <Head title="Site Settings" />
            <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Site Settings</h1>
                        <p className="text-sm text-muted-foreground">
                            Tracking, SEO and contact details applied across the public website.
                        </p>
                    </div>
                    <Button type="submit" disabled={processing}>
                        {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Tracking &amp; Analytics</CardTitle>
                        <CardDescription>
                            Prefer Google Tag Manager — you can load GA4, Meta Pixel, Google Ads and more inside it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <Field id="gtm_id" label="Google Tag Manager ID" value={data.gtm_id} onChange={(v) => setData('gtm_id', v)} placeholder="GTM-XXXXXXX" error={errors.gtm_id} />
                        <Field id="ga4_id" label="Google Analytics 4 ID" value={data.ga4_id} onChange={(v) => setData('ga4_id', v)} placeholder="G-XXXXXXXXXX" error={errors.ga4_id} />
                        <Field id="meta_pixel_id" label="Meta Pixel ID" value={data.meta_pixel_id} onChange={(v) => setData('meta_pixel_id', v)} placeholder="123456789012345" error={errors.meta_pixel_id} />
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
                        <Field id="default_og_image" label="Default social image URL" value={data.default_og_image} onChange={(v) => setData('default_og_image', v)} placeholder="/images/og-default.jpg" error={errors.default_og_image} />
                        <div className="sm:col-span-2">
                            <Field id="default_meta_title" label="Default meta title" value={data.default_meta_title} onChange={(v) => setData('default_meta_title', v)} placeholder="GC Communication — Electrical Distribution" hint={`${data.default_meta_title.length}/70 characters`} error={errors.default_meta_title} />
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
                        <CardTitle>Organization &amp; Contact</CardTitle>
                        <CardDescription>Used in the footer and in structured data (JSON-LD) for SEO.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <Field id="org_logo" label="Organization logo URL" value={data.org_logo} onChange={(v) => setData('org_logo', v)} placeholder="/images/gc-logo.svg" error={errors.org_logo} />
                        <Field id="contact_email" label="Contact email" type="email" value={data.contact_email} onChange={(v) => setData('contact_email', v)} placeholder="info@gc-communication.in" error={errors.contact_email} />
                        <Field id="contact_phone" label="Contact phone" value={data.contact_phone} onChange={(v) => setData('contact_phone', v)} placeholder="+91 ..." error={errors.contact_phone} />
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="contact_address">Address</Label>
                            <Textarea id="contact_address" rows={2} value={data.contact_address} onChange={(e) => setData('contact_address', e.target.value)} placeholder="Street, City, State, PIN" />
                            {errors.contact_address && <p className="text-xs text-destructive">{errors.contact_address}</p>}
                        </div>
                        <Field id="social_facebook" label="Facebook URL" value={data.social_facebook} onChange={(v) => setData('social_facebook', v)} placeholder="https://facebook.com/..." error={errors.social_facebook} />
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
                        {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save settings
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
