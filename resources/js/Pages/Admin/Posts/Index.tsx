import { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, X, ExternalLink } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import type { PostListItem } from '@/types';

export default function PostsIndex({ posts }: { posts: PostListItem[] }) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [search, setSearch] = useState('');

    const handleDelete = () => {
        if (!deleteId) return;
        setProcessing(true);
        router.delete(`/admin/blog/${deleteId}`, {
            onSuccess: () => { setDeleteId(null); toast.success('Post deleted.'); },
            onError: () => toast.error('Failed to delete post.'),
            onFinish: () => setProcessing(false),
        });
    };

    const columns = useMemo<ColumnDef<PostListItem>[]>(() => [
        {
            accessorKey: 'title',
            header: ({ column }) => <SortableHeader column={column} title="Title" />,
            cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => <Badge variant={row.original.status === 'published' ? 'default' : 'secondary'}>{row.original.status}</Badge>,
        },
        {
            id: 'published',
            header: 'Published',
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.published_at ? new Date(row.original.published_at).toLocaleDateString('en-IN') : '-'}</span>,
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    {row.original.status === 'published' && (
                        <Button asChild variant="ghost" size="icon"><a href={`/blog/${row.original.slug}`} target="_blank" rel="noopener"><ExternalLink className="h-4 w-4" /></a></Button>
                    )}
                    <Button asChild variant="ghost" size="icon"><Link href={`/admin/blog/${row.original.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.original.id)} className="text-destructive hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                </div>
            ),
        },
    ], []);

    const filtered = useMemo(() => posts.filter((p) => p.title.toLowerCase().includes(search.toLowerCase())), [posts, search]);

    const toolbar = (
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            {search && <Button variant="ghost" size="sm" onClick={() => setSearch('')} className="text-destructive hover:text-destructive shrink-0"><X className="h-4 w-4 mr-1" /> Reset</Button>}
            <Button asChild className="w-full sm:w-auto sm:ml-auto"><Link href="/admin/blog/create"><Plus className="h-4 w-4 mr-2" /> New post</Link></Button>
        </div>
    );

    return (
        <AdminLayout breadcrumbs={[{ label: 'Blog' }]}>
            <Head title="Blog" />
            <DataTable columns={columns} data={filtered} toolbar={toolbar} emptyMessage="No posts yet. Write your first one." />

            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete post</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this post? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={processing}>{processing ? 'Deleting...' : 'Delete'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
