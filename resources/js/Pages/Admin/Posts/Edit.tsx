import { Head } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import PostForm from '@/components/blog/PostForm';
import type { Post } from '@/types';

export default function PostEdit({ post }: { post: Post }) {
    return (
        <AdminLayout breadcrumbs={[{ label: 'Blog', href: '/admin/blog' }, { label: post.title }]}>
            <Head title={`Edit ${post.title}`} />
            <PostForm post={post} />
        </AdminLayout>
    );
}
