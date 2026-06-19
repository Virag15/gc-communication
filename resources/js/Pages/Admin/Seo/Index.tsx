import { useMemo, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Pencil,
    Globe,
    FileText,
    RefreshCw,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { formatDateTime } from '@/lib/dates';
import { type SeoSetting } from '@/types';

interface SeoPage {
    identifier: string;
    label: string;
}

interface SitemapInfo {
    last_generated?: string | null;
}

interface SeoIndexProps {
    seoSettings: SeoSetting[];
    pages: SeoPage[];
    sitemapInfo?: SitemapInfo;
}

export default function SeoIndex({ seoSettings, pages, sitemapInfo }: SeoIndexProps) {
    const [regenerating, setRegenerating] = useState(false);

    const pagesWithSeo = useMemo(() => {
        return (pages || []).map((page) => {
            const seo = (seoSettings || []).find(
                (s) => s.page_identifier === page.identifier
            );
            return {
                ...page,
                meta_title: seo?.meta_title || '',
                meta_description: seo?.meta_description || '',
                noindex: seo?.noindex || false,
                has_seo: !!seo?.meta_title,
            };
        });
    }, [seoSettings, pages]);

    function handleRegenerateSitemap() {
        setRegenerating(true);
        router.post('/admin/seo/sitemap/regenerate', {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Sitemap regenerated successfully.'),
            onError: () => toast.error('Failed to regenerate sitemap.'),
            onFinish: () => setRegenerating(false),
        });
    }

    return (
        <AdminLayout breadcrumbs={[{ label: 'SEO' }]}>
            <Head title="SEO" />
            <div className="space-y-6">
                {/* Page SEO Settings */}
                <Card>
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-sm font-medium">Page SEO Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                        <div className="divide-y divide-border">
                            {pagesWithSeo.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No pages found.</p>
                            ) : (
                                pagesWithSeo.map((page) => (
                                    <div
                                        key={page.identifier}
                                        className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0">
                                                <Globe className="size-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{page.label}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {page.meta_title || 'No meta title set'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pl-12 sm:pl-0 sm:shrink-0">
                                            {page.has_seo ? (
                                                <Badge variant="default" className="gap-1">
                                                    <CheckCircle2 className="size-3" />
                                                    Configured
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="gap-1">
                                                    <AlertCircle className="size-3" />
                                                    Not Set
                                                </Badge>
                                            )}
                                            {page.noindex && (
                                                <Badge variant="destructive">No Index</Badge>
                                            )}
                                            <Button asChild variant="ghost" size="icon" className="shrink-0 ml-auto sm:ml-0">
                                                <Link href={`/admin/seo/${page.identifier}/edit`}>
                                                    <Pencil className="size-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                {/* Sitemap */}
                <Card>
                    <CardHeader className="p-4 pb-0">
                        <div className="flex items-center gap-2">
                            <FileText className="size-4 text-muted-foreground" />
                            <CardTitle className="text-sm font-medium">Sitemap</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                        <p className="text-xs text-muted-foreground mb-4">
                            Auto-generated at <code className="rounded bg-muted px-1 py-0.5 text-[11px]">/sitemap.xml</code>
                        </p>

                        {sitemapInfo?.last_generated && (
                            <p className="text-xs text-muted-foreground mb-4">
                                Last generated:{' '}
                                <span className="font-medium text-foreground">
                                    {formatDateTime(sitemapInfo.last_generated)}
                                </span>
                            </p>
                        )}

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleRegenerateSitemap}
                                disabled={regenerating}
                                className="gap-1.5 w-full sm:w-auto"
                            >
                                <RefreshCw className={`size-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                                {regenerating ? 'Regenerating...' : 'Regenerate Sitemap'}
                            </Button>

                            <Button asChild variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto">
                                <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="size-3.5" />
                                    View Sitemap
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
