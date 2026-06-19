import { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, X, Eye } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import type { BomListItem } from '@/types';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function BomIndex({ boms }: { boms: BomListItem[] }) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [search, setSearch] = useState('');

    const handleDelete = () => {
        if (!deleteId) return;
        setProcessing(true);
        router.delete(`/admin/bom/${deleteId}`, {
            onSuccess: () => { setDeleteId(null); toast.success('BOM deleted.'); },
            onError: () => toast.error('Failed to delete BOM.'),
            onFinish: () => setProcessing(false),
        });
    };

    const columns = useMemo<ColumnDef<BomListItem>[]>(() => [
        {
            accessorKey: 'name',
            header: ({ column }) => <SortableHeader column={column} title="Name" />,
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        },
        {
            id: 'customer',
            header: 'Customer',
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.customer || '-'}</span>,
        },
        {
            id: 'config',
            header: 'System',
            cell: ({ row }) => (
                <Badge variant="secondary">
                    {row.original.material === 'W' ? 'Wood' : 'Aluminium'} · {row.original.width_ft}x{row.original.height_ft} ft
                </Badge>
            ),
        },
        {
            accessorKey: 'grand_total',
            header: ({ column }) => <SortableHeader column={column} title="Total" />,
            cell: ({ row }) => <span className="font-medium tabular-nums">{inr.format(row.original.grand_total)}</span>,
        },
        {
            id: 'updated',
            header: 'Updated',
            cell: ({ row }) => <span className="text-muted-foreground">{new Date(row.original.updated_at).toLocaleDateString('en-IN')}</span>,
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/bom/${row.original.id}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/bom/${row.original.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.original.id)} className="text-destructive hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ], []);

    const filtered = useMemo(
        () => boms.filter((b) => `${b.name} ${b.customer ?? ''}`.toLowerCase().includes(search.toLowerCase())),
        [boms, search],
    );

    const toolbar = (
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search BOMs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            {search && (
                <Button variant="ghost" size="sm" onClick={() => setSearch('')} className="text-destructive hover:text-destructive shrink-0">
                    <X className="h-4 w-4 mr-1" /> Reset
                </Button>
            )}
            <Button asChild className="w-full sm:w-auto sm:ml-auto">
                <Link href="/admin/bom/create"><Plus className="h-4 w-4 mr-2" /> New BOM</Link>
            </Button>
        </div>
    );

    return (
        <AdminLayout breadcrumbs={[{ label: 'BOM' }]}>
            <Head title="BOM" />
            <DataTable columns={columns} data={filtered} toolbar={toolbar} emptyMessage="No BOMs yet. Create your first one." />

            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete BOM</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this BOM? This action cannot be undone.</DialogDescription>
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
