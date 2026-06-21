import { useRef } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Check, ArrowLeft, Upload, FileText, Loader2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { type Brand } from '@/types';

interface CatalogueCreateProps {
    brands: Pick<Brand, 'id' | 'name' | 'logo'>[];
}

const NO_BRAND = 'none';

export default function CatalogueCreate({ brands }: CatalogueCreateProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        brand_id: string;
        file: File | null;
        sort_order: number;
        is_active: boolean;
    }>({
        title: '',
        brand_id: '',
        file: null,
        sort_order: 0,
        is_active: true,
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post('/admin/catalogues', {
            forceFormData: true,
            onSuccess: () => toast.success('Catalogue created successfully.'),
            onError: () => toast.error('Failed to create catalogue. Please check the form.'),
        });
    }

    return (
        <AdminLayout breadcrumbs={[{ label: 'Catalogues', href: '/admin/catalogues' }, { label: 'Create' }]}>
            <Head title="Create Catalogue" />
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
                    <Link href="/admin/catalogues">
                        <ArrowLeft className="h-4 w-4" /> Back to Catalogues
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
                            <Label htmlFor="title">Title *</Label>
                            <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} required />
                            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand_id">Brand</Label>
                            <Select
                                value={data.brand_id === '' ? NO_BRAND : data.brand_id}
                                onValueChange={(v) => setData('brand_id', v === NO_BRAND ? '' : v)}
                            >
                                <SelectTrigger id="brand_id">
                                    <SelectValue placeholder="Select a brand" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_BRAND}>No brand / General</SelectItem>
                                    {brands.map((brand) => (
                                        <SelectItem key={brand.id} value={String(brand.id)}>
                                            <span className="flex items-center gap-2">
                                                {brand.logo ? (
                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white p-0.5">
                                                        <img src={brand.logo} alt="" className="h-full w-full object-contain" />
                                                    </span>
                                                ) : null}
                                                {brand.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.brand_id && <p className="text-sm text-destructive">{errors.brand_id}</p>}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* File */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">PDF File</Label>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="file">File *</Label>
                        <div className="flex items-center gap-3">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 space-y-1.5">
                                <input
                                    ref={fileInputRef}
                                    id="file"
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    className="sr-only"
                                    onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="h-3.5 w-3.5" />
                                    {data.file ? 'Change file' : 'Upload PDF'}
                                </Button>
                                <p className="truncate text-xs text-muted-foreground">
                                    {data.file ? data.file.name : 'PDF up to 20 MB'}
                                </p>
                            </div>
                        </div>
                        {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}
                    </div>
                </div>

                <Separator />

                {/* Ordering & Status */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Ordering & Status</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="sort_order">Sort order</Label>
                            <Input
                                id="sort_order"
                                type="number"
                                min={0}
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', Number(e.target.value))}
                            />
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
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {processing ? 'Creating...' : 'Create Catalogue'}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                        <Link href="/admin/catalogues">Cancel</Link>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
