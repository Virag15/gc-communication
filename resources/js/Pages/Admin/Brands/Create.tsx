import { useEffect, useMemo, useRef } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { ArrowLeft, Image as ImageIcon, Upload, Loader2, Save } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface BrandForm {
    name: string;
    description: string;
    logo: File | null;
    website: string;
    sort_order: number;
    is_active: boolean;
}

export default function BrandCreate() {
    const { data, setData, post, processing, errors } = useForm<BrandForm>({
        name: '',
        description: '',
        logo: null,
        website: '',
        sort_order: 0,
        is_active: true,
    });

    const inputRef = useRef<HTMLInputElement>(null);
    const preview = useMemo(() => (data.logo ? URL.createObjectURL(data.logo) : null), [data.logo]);
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post('/admin/brands', {
            forceFormData: true,
            onSuccess: () => toast.success('Brand created.'),
            onError: () => toast.error('Failed to create brand. Please check the form.'),
        });
    }

    return (
        <AdminLayout breadcrumbs={[{ label: 'Brands', href: '/admin/brands' }, { label: 'Create' }]}>
            <Head title="Create Brand" />
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
                    <Link href="/admin/brands">
                        <ArrowLeft className="h-4 w-4" /> Back to Brands
                    </Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Basic Info</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input id="website" type="url" value={data.website} onChange={(e) => setData('website', e.target.value)} placeholder="https://example.com" />
                            {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Logo */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Logo</Label>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                                {preview ? (
                                    <img src={preview} alt="" className="h-full w-full object-contain" />
                                ) : (
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="min-w-0 space-y-1.5">
                                <input ref={inputRef} id="logo" type="file" accept="image/*" className="sr-only" onChange={(e) => setData('logo', e.target.files?.[0] ?? null)} />
                                <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                                    <Upload className="h-3.5 w-3.5" />
                                    {data.logo ? 'Change image' : 'Upload image'}
                                </Button>
                                <p className="truncate text-xs text-muted-foreground">
                                    {data.logo ? data.logo.name : 'PNG, JPG, WebP or SVG'}
                                </p>
                            </div>
                        </div>
                        {errors.logo && <p className="text-xs text-destructive">{errors.logo}</p>}
                    </div>
                </div>

                <Separator />

                {/* Settings */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Settings</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="sort_order">Sort order</Label>
                            <Input id="sort_order" type="number" min={0} value={data.sort_order} onChange={(e) => setData('sort_order', Number(e.target.value))} />
                            {errors.sort_order && <p className="text-sm text-destructive">{errors.sort_order}</p>}
                        </div>
                        <div className="flex items-center gap-3 pb-0.5">
                            <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                            <Label htmlFor="is_active" className="font-normal cursor-pointer">Active</Label>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing}>
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {processing ? 'Creating...' : 'Create Brand'}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                        <Link href="/admin/brands">Cancel</Link>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
