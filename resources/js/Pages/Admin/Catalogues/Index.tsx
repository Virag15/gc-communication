import { useState, useMemo } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { type Catalogue } from '@/types';

interface CataloguesIndexProps {
    catalogues: Catalogue[];
}

function formatFileSize(bytes: number | null): string {
    if (!bytes || bytes <= 0) return '-';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CataloguesIndex({ catalogues }: CataloguesIndexProps) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleDelete = () => {
        if (deleteId) {
            setProcessing(true);
            router.delete(`/admin/catalogues/${deleteId}`, {
                onSuccess: () => { setDeleteId(null); toast.success('Catalogue deleted successfully.'); },
                onError: () => toast.error('Failed to delete catalogue.'),
                onFinish: () => setProcessing(false),
            });
        }
    };

    const columns = useMemo<ColumnDef<Catalogue>[]>(() => [
        {
            accessorKey: 'title',
            header: ({ column }) => <SortableHeader column={column} title="Title" />,
            cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
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
            id: 'size',
            header: 'Size',
            cell: ({ row }) => (
                <span className="text-muted-foreground">{formatFileSize(row.original.file_size)}</span>
            ),
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
                        <a href={row.original.file} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                    <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/catalogues/${row.original.id}/edit`}>
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

    const toolbar = (
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
            <Button asChild className="w-full sm:w-auto sm:ml-auto">
                <Link href="/admin/catalogues/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Add catalogue
                </Link>
            </Button>
        </div>
    );

    return (
        <AdminLayout breadcrumbs={[{ label: 'Catalogues' }]}>
            <Head title="Catalogues" />
            <DataTable
                columns={columns}
                data={catalogues}
                toolbar={toolbar}
                emptyMessage="No catalogues found."
            />

            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Catalogue</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this catalogue? This action cannot be undone.
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
