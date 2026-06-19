import { useState, useMemo, type ChangeEvent } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import { type ColumnDef } from '@tanstack/react-table';
import { type Paginated, type User } from '@/types';

interface UsersIndexProps {
    users: Paginated<User> | User[];
}

export default function UsersIndex({ users }: UsersIndexProps) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    const debouncedSearch = useDebouncedCallback((value: string) => {
        router.get('/admin/users', { search: value || undefined }, { preserveState: true, replace: true });
    }, 300);

    const handleSearch = (value: string) => {
        setSearch(value);
        debouncedSearch(value);
    };

    const clearFilters = () => {
        setSearch('');
        router.get('/admin/users', {}, { preserveState: true, replace: true });
    };

    const handleDelete = () => {
        if (deleteId) {
            setProcessing(true);
            router.delete(`/admin/users/${deleteId}`, {
                onSuccess: () => { setDeleteId(null); toast.success('User deleted successfully.'); },
                onError: () => toast.error('Failed to delete user.'),
                onFinish: () => setProcessing(false),
            });
        }
    };

    const columns = useMemo<ColumnDef<User>[]>(() => [
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
            id: 'role',
            header: 'Role',
            cell: ({ row }) => (
                <Badge variant="secondary">
                    {row.original.role || 'admin'}
                </Badge>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
                    {row.original.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Created',
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
                        <Link href={`/admin/users/${row.original.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                    {row.original.id !== auth?.user?.id && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(row.original.id)}
                            className="text-destructive hover:text-red-700"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ], [auth]);

    const toolbar = (
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
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
            <Button asChild className="w-full sm:w-auto sm:ml-auto">
                <Link href="/admin/users/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                </Link>
            </Button>
        </div>
    );

    const paginated = !Array.isArray(users) ? users : undefined;

    return (
        <AdminLayout breadcrumbs={[{ label: 'Users' }]}>
            <Head title="Users" />
            <DataTable
                columns={columns}
                data={paginated?.data || (Array.isArray(users) ? users : []) || []}
                toolbar={toolbar}
                serverPagination={paginated?.last_page ? {
                    current_page: paginated.current_page,
                    last_page: paginated.last_page,
                    from: paginated.from,
                    to: paginated.to,
                    total: paginated.total,
                    prev_page_url: paginated.prev_page_url,
                    next_page_url: paginated.next_page_url,
                    links: paginated.links,
                } : undefined}
                emptyMessage="No users found."
            />

            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
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
