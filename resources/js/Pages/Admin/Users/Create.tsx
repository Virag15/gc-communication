import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { type Role } from '@/types';

export default function UserCreate() {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
        role: Role;
        is_active: boolean;
    }>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'admin',
        is_active: true,
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post('/admin/users', { onSuccess: () => toast.success('User created successfully.'), onError: () => toast.error('Failed to create user. Please check the form.') });
    }

    return (
        <AdminLayout breadcrumbs={[{ label: 'Users', href: '/admin/users' }, { label: 'Create' }]}>
            <Head title="Create User" />
            {/* Same form structure as Edit.jsx but:
               - Password fields are required (not optional)
               - Submit says "Create User"
               - Title says "Create"
               - No "Leave blank" hint for password
            */}
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
                    <Link href="/admin/users">
                        <ArrowLeft className="h-4 w-4" /> Back to Users
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
                            <Label htmlFor="email">Email *</Label>
                            <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Password */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Password</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <Input id="password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} required />
                            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Confirm Password *</Label>
                            <Input id="password_confirmation" type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} required />
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Role & Status */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Role & Status</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select value={data.role} onValueChange={(v) => setData('role', v as Role)}>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="editor">Editor</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                        </div>
                        <div className="flex items-center gap-3 pb-0.5">
                            <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                            <Label htmlFor="is_active" className="font-normal cursor-pointer">Active Account</Label>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing}>
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {processing ? 'Creating...' : 'Create User'}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                        <Link href="/admin/users">Cancel</Link>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
