import { Head } from '@inertiajs/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import BomEditor from '@/components/bom/BomEditor';
import type { Bom, BomCompany } from '@/types';

export default function BomEdit({ bom, company }: { bom: Bom; company: BomCompany }) {
    return (
        <AdminLayout breadcrumbs={[{ label: 'BOM', href: '/admin/bom' }, { label: bom.name }]}>
            <Head title={`Edit ${bom.name}`} />
            <BomEditor bom={bom} company={company} />
        </AdminLayout>
    );
}
