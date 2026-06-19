import { useState, useMemo } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, X, Image as ImageIcon } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { type Brand } from '@/types';

interface BrandsIndexProps {
    brands: Brand[];
}

export default function BrandsIndex({ brands }: BrandsIndexProps) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [search, setSearch] = useState('');

    const handleDelete = () => {
        if (deleteId) {
            setProcessing(true);
            router.delete(`/admin/brands/${deleteId}`, {
                onSuccess: () => { setDeleteId(null); toast.success('Brand deleted.'); },
                onError: () => toast.error('Failed to delete brand.'),
                onFinish: () => setProcessing(false),
            });
        }
    };

    const columns = useMemo<ColumnDef<Brand>[]>(() => [
        {
            id: 'logo',
            header: () => <span className="sr-only">Logo</span>,
            cell: ({ row }) => (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                    {row.original.logo ? (
                        <img src={row.original.logo} alt={row.original.name} className="h-full w-full object-contain" />
                    ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'name',
            header: ({ column }) => <SortableHeader column={column} title="Name" />,
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
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
            accessorKey: 'sort_order',
            header: 'Sort order',
            cell: ({ row }) => (
                <span className="text-muted-foreground">{row.original.sort_order}</span>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/brands/${row.original.id}/edit`}>
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
        () => brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase())),
        [brands, search],
    );

    const toolbar = (
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search brands..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            {search && (
                <Button variant="ghost" size="sm" onClick={() => setSearch('')} className="text-destructive hover:text-destructive shrink-0">
                    <X className="h-4 w-4 mr-1" /> Reset
                </Button>
            )}
            <Button asChild className="w-full sm:w-auto sm:ml-auto">
                <Link href="/admin/brands/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Add brand
                </Link>
            </Button>
        </div>
    );

    return (
        <AdminLayout breadcrumbs={[{ label: 'Brands' }]}>
            <Head title="Brands" />
            <DataTable
                columns={columns}
                data={filtered}
                toolbar={toolbar}
                emptyMessage="No brands found."
            />

            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Brand</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this brand? This action cannot be undone.
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
