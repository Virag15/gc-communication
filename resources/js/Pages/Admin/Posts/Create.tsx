import { Head } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import PostForm from '@/components/blog/PostForm';

export default function PostCreate() {
    return (
        <AdminLayout breadcrumbs={[{ label: 'Blog', href: '/admin/blog' }, { label: 'New' }]}>
            <Head title="New post" />
            <PostForm />
        </AdminLayout>
    );
}
