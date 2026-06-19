import { useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/dates';
import { type Enquiry } from '@/types';

interface EnquiryShowProps {
    enquiry: Enquiry;
}

export default function EnquiryShow({ enquiry }: EnquiryShowProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleDelete = () => {
        setProcessing(true);
        router.delete(`/admin/enquiries/${enquiry.id}`, {
            onSuccess: () => { setConfirmDelete(false); toast.success('Enquiry deleted.'); },
            onError: () => toast.error('Failed to delete enquiry.'),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AdminLayout
            breadcrumbs={[
                { label: 'Enquiries', href: '/admin/enquiries' },
                { label: enquiry.name },
            ]}
        >
            <Head title="Enquiry" />

            <div className="mb-6 flex items-center justify-between gap-3">
                <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
                    <Link href="/admin/enquiries">
                        <ArrowLeft className="h-4 w-4" /> Back to Enquiries
                    </Link>
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                    className="gap-1.5"
                >
                    <Trash2 className="h-4 w-4" /> Delete
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg">{enquiry.name}</CardTitle>
                        <Badge variant={enquiry.status === 'new' ? 'default' : 'secondary'}>
                            {enquiry.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <dt className="text-xs font-medium text-muted-foreground">Email</dt>
                            <dd>
                                <a
                                    href={`mailto:${enquiry.email}`}
                                    className="text-sm text-primary underline-offset-4 hover:underline"
                                >
                                    {enquiry.email}
                                </a>
                            </dd>
                        </div>
                        <div className="space-y-1">
                            <dt className="text-xs font-medium text-muted-foreground">Phone</dt>
                            <dd className="text-sm">{enquiry.phone || '-'}</dd>
                        </div>
                        <div className="space-y-1">
                            <dt className="text-xs font-medium text-muted-foreground">Company</dt>
                            <dd className="text-sm">{enquiry.company || '-'}</dd>
                        </div>
                        <div className="space-y-1">
                            <dt className="text-xs font-medium text-muted-foreground">Received</dt>
                            <dd className="text-sm">{formatDateTime(enquiry.created_at)}</dd>
                        </div>
                    </dl>

                    <Separator />

                    <div className="space-y-2">
                        <dt className="text-xs font-medium text-muted-foreground">Message</dt>
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                            {enquiry.message}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={confirmDelete} onOpenChange={() => setConfirmDelete(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Enquiry</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this enquiry? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                            {processing ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
