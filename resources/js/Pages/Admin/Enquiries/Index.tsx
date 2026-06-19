import { useState, useMemo, type ChangeEvent } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Eye, Trash2, Search, X } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import { type ColumnDef } from '@tanstack/react-table';
import { type Enquiry } from '@/types';

interface EnquiriesIndexProps {
    enquiries: Enquiry[];
    filters: {
        search?: string | null;
    };
}

export default function EnquiriesIndex({ enquiries, filters }: EnquiriesIndexProps) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    const debouncedSearch = useDebouncedCallback((value: string) => {
        router.get('/admin/enquiries', { search: value || undefined }, { preserveState: true, replace: true });
    }, 300);

    const handleSearch = (value: string) => {
        setSearch(value);
        debouncedSearch(value);
    };

    const clearFilters = () => {
        setSearch('');
        router.get('/admin/enquiries', {}, { preserveState: true, replace: true });
    };

    const handleDelete = () => {
        if (deleteId) {
            setProcessing(true);
            router.delete(`/admin/enquiries/${deleteId}`, {
                onSuccess: () => { setDeleteId(null); toast.success('Enquiry deleted.'); },
                onError: () => toast.error('Failed to delete enquiry.'),
                onFinish: () => setProcessing(false),
            });
        }
    };

    const columns = useMemo<ColumnDef<Enquiry>[]>(() => [
        {
            accessorKey: 'name',
            header: ({ column }) => <SortableHeader column={column} title="Name" />,
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.status === 'new' ? 'default' : 'secondary'}>
                    {row.original.status}
                </Badge>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Received',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {formatDate(row.original.created_at)}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/enquiries/${row.original.id}`}>
                            <Eye className="h-4 w-4" />
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

    const toolbar = (
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search enquiries..."
                        value={search}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                {search && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive hover:text-destructive shrink-0">
                        <X className="h-4 w-4 mr-1" />
                        Reset
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <AdminLayout breadcrumbs={[{ label: 'Enquiries' }]}>
            <Head title="Enquiries" />
            <DataTable
                columns={columns}
                data={enquiries}
                toolbar={toolbar}
                emptyMessage="No enquiries found."
            />

            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Enquiry</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this enquiry? This action cannot be undone.
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
