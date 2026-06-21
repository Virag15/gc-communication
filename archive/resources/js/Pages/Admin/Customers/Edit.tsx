import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { type Customer } from '@/types';

interface CustomerEditProps {
    customer: Customer;
}

interface CustomerForm {
    name: string;
    company: string;
    phone: string;
    email: string;
    address: string;
    gstin: string;
    ref_by: string;
    notes: string;
}

export default function CustomerEdit({ customer }: CustomerEditProps) {
    const { data, setData, put, processing, errors } = useForm<CustomerForm>({
        name: customer.name || '',
        company: customer.company || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        gstin: customer.gstin || '',
        ref_by: customer.ref_by || '',
        notes: customer.notes || '',
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        put(`/admin/customers/${customer.id}`, {
            onSuccess: () => toast.success('Customer updated.'),
            onError: () => toast.error('Failed to update customer. Please check the form.'),
        });
    }

    return (
        <AdminLayout breadcrumbs={[{ label: 'Customers', href: '/admin/customers' }, { label: 'Edit' }]}>
            <Head title="Edit Customer" />
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
                    <Link href="/admin/customers">
                        <ArrowLeft className="h-4 w-4" /> Back to Customers
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
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input id="company" value={data.company} onChange={(e) => setData('company', e.target.value)} />
                            {errors.company && <p className="text-sm text-destructive">{errors.company}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Billing & Reference */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Billing & Reference</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" rows={2} value={data.address} onChange={(e) => setData('address', e.target.value)} />
                            {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gstin">GSTIN</Label>
                            <Input id="gstin" value={data.gstin} onChange={(e) => setData('gstin', e.target.value)} />
                            {errors.gstin && <p className="text-sm text-destructive">{errors.gstin}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ref_by">Referred by</Label>
                            <Input id="ref_by" value={data.ref_by} onChange={(e) => setData('ref_by', e.target.value)} />
                            {errors.ref_by && <p className="text-sm text-destructive">{errors.ref_by}</p>}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Notes */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Notes</Label>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                        {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
                    </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving...' : 'Update Customer'}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                        <Link href="/admin/customers">Cancel</Link>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
