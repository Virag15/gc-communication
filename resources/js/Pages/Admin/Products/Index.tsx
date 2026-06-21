import { useState, useMemo } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, X, Image as ImageIcon, Upload } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { type Brand, type Product } from '@/types';

interface ProductsIndexProps {
    products: Product[];
    brands: Pick<Brand, 'id' | 'name'>[];
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function ProductsIndex({ products }: ProductsIndexProps) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [search, setSearch] = useState('');

    const handleDelete = () => {
        if (deleteId) {
            setProcessing(true);
            router.delete(`/admin/products/${deleteId}`, {
                onSuccess: () => { setDeleteId(null); toast.success('Product deleted successfully.'); },
                onError: () => toast.error('Failed to delete product.'),
                onFinish: () => setProcessing(false),
            });
        }
    };

    const columns = useMemo<ColumnDef<Product>[]>(() => [
        {
            id: 'image',
            header: () => <span className="sr-only">Image</span>,
            cell: ({ row }) => (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                    {row.original.image ? (
                        <img src={row.original.image} alt={row.original.name} className="h-full w-full object-contain" />
                    ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'name',
            header: ({ column }) => <SortableHeader column={column} title="Name" />,
            cell: ({ row }) => (
                <div className="min-w-0">
                    <span className="font-medium">{row.original.name}</span>
                    <p className="text-xs text-muted-foreground">{row.original.item_no}</p>
                </div>
            ),
        },
        {
            id: 'brand',
            header: 'Brand',
            cell: ({ row }) => (
                row.original.brand?.name
                    ? <span>{row.original.brand.name}</span>
                    : <span className="text-muted-foreground">General</span>
            ),
        },
        {
            accessorKey: 'price',
            header: ({ column }) => <SortableHeader column={column} title="Price" />,
            cell: ({ row }) => <span className="font-medium">{inr.format(row.original.price)}</span>,
        },
        {
            id: 'status',
            header: 'Active',
            cell: ({ row }) => (
                <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
                    {row.original.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/products/${row.original.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(row.original.id)}
                        className="text-destructive hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ], []);

    const filtered = useMemo(
        () => products.filter((p) => {
            const q = search.toLowerCase();
            return p.name.toLowerCase().includes(q) || p.item_no.toLowerCase().includes(q);
        }),
        [products, search],
    );

    const toolbar = (
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            {search && (
                <Button variant="ghost" size="sm" onClick={() => setSearch('')} className="text-destructive hover:text-destructive shrink-0">
                    <X className="h-4 w-4 mr-1" /> Reset
                </Button>
            )}
            <div className="flex gap-2 sm:ml-auto">
                <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link href="/admin/products/import">
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                    </Link>
                </Button>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/admin/products/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Add product
                    </Link>
                </Button>
            </div>
        </div>
    );

    return (
        <AdminLayout breadcrumbs={[{ label: 'Products' }]}>
            <Head title="Products" />
            <DataTable
                columns={columns}
                data={filtered}
                toolbar={toolbar}
                emptyMessage="No products found."
            />

            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this product? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                            {processing ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
