import { useState, useMemo } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { type Customer } from '@/types';

interface CustomersIndexProps {
    customers: Customer[];
}

export default function CustomersIndex({ customers }: CustomersIndexProps) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [search, setSearch] = useState('');

    const handleDelete = () => {
        if (deleteId) {
            setProcessing(true);
            router.delete(`/admin/customers/${deleteId}`, {
                onSuccess: () => { setDeleteId(null); toast.success('Customer deleted.'); },
                onError: () => toast.error('Failed to delete customer.'),
                onFinish: () => setProcessing(false),
            });
        }
    };

    const columns = useMemo<ColumnDef<Customer>[]>(() => [
        {
            accessorKey: 'name',
            header: ({ column }) => <SortableHeader column={column} title="Name" />,
            cell: ({ row }) => (
                <div className="min-w-0">
                    <span className="font-medium">{row.original.name}</span>
                    {row.original.company && (
                        <p className="truncate text-xs text-muted-foreground">{row.original.company}</p>
                    )}
                </div>
            ),
        },
        {
            id: 'phone',
            header: 'Phone',
            cell: ({ row }) => (
                row.original.phone
                    ? <span>{row.original.phone}</span>
                    : <span className="text-muted-foreground">-</span>
            ),
        },
        {
            id: 'email',
            header: 'Email',
            cell: ({ row }) => (
                row.original.email
                    ? <span>{row.original.email}</span>
                    : <span className="text-muted-foreground">-</span>
            ),
        },
        {
            id: 'gstin',
            header: 'GSTIN',
            cell: ({ row }) => (
                row.original.gstin
                    ? <span className="text-muted-foreground">{row.original.gstin}</span>
                    : <span className="text-muted-foreground">-</span>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/customers/${row.original.id}/edit`}>
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
        () => customers.filter((c) => {
            const q = search.toLowerCase();
            return c.name.toLowerCase().includes(q)
                || (c.company ?? '').toLowerCase().includes(q)
                || (c.phone ?? '').toLowerCase().includes(q);
        }),
        [customers, search],
    );

    const toolbar = (
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            {search && (
                <Button variant="ghost" size="sm" onClick={() => setSearch('')} className="text-destructive hover:text-destructive shrink-0">
                    <X className="h-4 w-4 mr-1" /> Reset
                </Button>
            )}
            <Button asChild className="w-full sm:w-auto sm:ml-auto">
                <Link href="/admin/customers/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Add customer
                </Link>
            </Button>
        </div>
    );

    return (
        <AdminLayout breadcrumbs={[{ label: 'Customers' }]}>
            <Head title="Customers" />
            <DataTable
                columns={columns}
                data={filtered}
                toolbar={toolbar}
                emptyMessage="No customers found."
            />

            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Customer</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this customer? This action cannot be undone.
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
