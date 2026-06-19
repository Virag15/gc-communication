import { Head } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import BomEditor from '@/components/bom/BomEditor';
import type { BomCompany } from '@/types';

export default function BomCreate({ company }: { company: BomCompany }) {
    return (
        <AdminLayout breadcrumbs={[{ label: 'BOM', href: '/admin/bom' }, { label: 'New' }]}>
            <Head title="New BOM" />
            <BomEditor company={company} />
        </AdminLayout>
    );
}
