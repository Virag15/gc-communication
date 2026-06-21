import { useEffect, useMemo, useRef } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { ArrowLeft, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { type Brand } from '@/types';

interface ProductCreateProps {
    brands: Pick<Brand, 'id' | 'name'>[];
}

interface ProductForm {
    item_no: string;
    name: string;
    spec: string;
    price: number;
    mrp: string;
    brand_id: string;
    category: string;
    bulk: string;
    image: File | null;
    is_active: boolean;
    sort_order: number;
}

const NO_BRAND = 'none';

export default function ProductCreate({ brands }: ProductCreateProps) {
    const { data, setData, post, processing, errors } = useForm<ProductForm>({
        item_no: '',
        name: '',
        spec: '',
        price: 0,
        mrp: '',
        brand_id: '',
        category: '',
        bulk: '',
        image: null,
        is_active: true,
        sort_order: 0,
    });

    const inputRef = useRef<HTMLInputElement>(null);
    const preview = useMemo(() => (data.image ? URL.createObjectURL(data.image) : null), [data.image]);
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post('/admin/products', {
            forceFormData: true,
            onSuccess: () => toast.success('Product created successfully.'),
            onError: () => toast.error('Failed to create product. Please check the form.'),
        });
    }

    return (
        <AdminLayout breadcrumbs={[{ label: 'Products', href: '/admin/products' }, { label: 'Create' }]}>
            <Head title="Create Product" />
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
                    <Link href="/admin/products">
                        <ArrowLeft className="h-4 w-4" /> Back to Products
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
                            <Label htmlFor="item_no">Item no *</Label>
                            <Input id="item_no" value={data.item_no} onChange={(e) => setData('item_no', e.target.value)} placeholder="MCB-32" required />
                            {errors.item_no && <p className="text-sm text-destructive">{errors.item_no}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="spec">Spec</Label>
                            <Input id="spec" value={data.spec} onChange={(e) => setData('spec', e.target.value)} placeholder="32A · C-curve · 1P" />
                            {errors.spec && <p className="text-sm text-destructive">{errors.spec}</p>}
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
                                        <SelectItem key={brand.id} value={String(brand.id)}>{brand.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.brand_id && <p className="text-sm text-destructive">{errors.brand_id}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" value={data.category} onChange={(e) => setData('category', e.target.value)} placeholder="MCB" />
                            {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Pricing */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Pricing</Label>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (INR) *</Label>
                            <Input id="price" type="number" min={0} step="0.01" value={data.price} onChange={(e) => setData('price', Number(e.target.value))} required />
                            {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mrp">MRP (INR)</Label>
                            <Input id="mrp" type="number" min={0} step="0.01" value={data.mrp} onChange={(e) => setData('mrp', e.target.value)} />
                            {errors.mrp && <p className="text-sm text-destructive">{errors.mrp}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bulk">Bulk hint</Label>
                            <Input id="bulk" value={data.bulk} onChange={(e) => setData('bulk', e.target.value)} placeholder="10+ @ 350" />
                            {errors.bulk && <p className="text-sm text-destructive">{errors.bulk}</p>}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Image */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Image</Label>
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
                                <input ref={inputRef} id="image" type="file" accept="image/*" className="sr-only" onChange={(e) => setData('image', e.target.files?.[0] ?? null)} />
                                <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                                    <Upload className="h-3.5 w-3.5" />
                                    {data.image ? 'Change image' : 'Upload image'}
                                </Button>
                                <p className="truncate text-xs text-muted-foreground">
                                    {data.image ? data.image.name : 'PNG, JPG, WebP or SVG up to 2 MB'}
                                </p>
                            </div>
                        </div>
                        {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
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
                        {processing ? 'Creating...' : 'Create Product'}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                        <Link href="/admin/products">Cancel</Link>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
