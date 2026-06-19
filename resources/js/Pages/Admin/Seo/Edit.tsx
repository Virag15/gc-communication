import { useRef, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    Search,
    Upload,
    X,
    Link2,
    Code2,
    Tags,
    Share2,
    Eye,
    Settings2,
} from 'lucide-react';
import { type SeoSetting } from '@/types';

interface SeoEditProps {
    seo: SeoSetting & {
        meta_keywords?: string | string[];
        canonical_url?: string | null;
    };
}

export default function SeoEdit({ seo }: SeoEditProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm<{
        _method: string;
        meta_title: string;
        meta_description: string;
        og_image: File | null;
        meta_keywords: string;
        structured_data: string;
        canonical_url: string;
        noindex: boolean;
    }>({
        _method: 'put',
        meta_title: seo.meta_title || '',
        meta_description: seo.meta_description || '',
        og_image: null,
        meta_keywords: Array.isArray(seo.meta_keywords)
            ? seo.meta_keywords.join(', ')
            : (seo.meta_keywords || ''),
        structured_data: seo.structured_data || '',
        canonical_url: seo.canonical_url || '',
        noindex: seo.noindex || false,
    });

    const ogPreview = data.og_image
        ? URL.createObjectURL(data.og_image)
        : (seo.og_image || null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setData('og_image', file);
        }
    }

    function clearOgImage() {
        setData('og_image', null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(`/admin/seo/${seo.page_identifier}`, {
            forceFormData: true,
            onSuccess: () => toast.success('SEO settings saved successfully.'),
            onError: () => toast.error('Failed to save SEO settings. Please check the form.'),
        });
    }

    // page_identifier is always provided for the edit page; cast the optional-chain
    // operands so strict `+` accepts them without altering the runtime expression.
    const pageName =
        (seo.page_identifier?.charAt(0).toUpperCase() as string) +
        (seo.page_identifier?.slice(1) as string);

    const previewTitle = data.meta_title || pageName || 'Page Title';
    const previewDescription =
        data.meta_description || 'No description provided. Add a meta description to control how this page appears in search results.';

    return (
        <AdminLayout
            breadcrumbs={[
                { label: 'SEO', href: '/admin/seo' },
                { label: pageName },
            ]}
        >
            <Head title={`SEO: ${pageName}`} />
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                    <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 shrink-0">
                        <Link href="/admin/seo">
                            <ArrowLeft className="size-3.5" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                            <Link href="/admin/seo">Cancel</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>

                {/* Google Preview - compact */}
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Eye className="size-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Search Preview</span>
                    </div>
                    <div className="max-w-lg">
                        <p className="text-[11px] text-muted-foreground truncate">
                            {data.canonical_url || `https://example.com/${seo.page_identifier || ''}`}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate leading-snug">
                            {previewTitle}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {previewDescription}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="meta" className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="meta" className="gap-1 sm:gap-1.5 text-[11px] sm:text-xs px-2 sm:px-3">
                            <Tags className="size-3 sm:size-3.5" />
                            <span className="hidden xs:inline">Meta </span>Tags
                        </TabsTrigger>
                        <TabsTrigger value="social" className="gap-1 sm:gap-1.5 text-[11px] sm:text-xs px-2 sm:px-3">
                            <Share2 className="size-3 sm:size-3.5" />
                            Social
                        </TabsTrigger>
                        <TabsTrigger value="advanced" className="gap-1 sm:gap-1.5 text-[11px] sm:text-xs px-2 sm:px-3">
                            <Settings2 className="size-3 sm:size-3.5" />
                            Advanced
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Meta Tags */}
                    <TabsContent value="meta" className="mt-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Meta Title */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="meta_title">Meta Title</Label>
                                    <span className="text-[10px] text-muted-foreground tabular-nums">
                                        {data.meta_title.length}/70
                                    </span>
                                </div>
                                <Input
                                    id="meta_title"
                                    value={data.meta_title}
                                    onChange={(e) => setData('meta_title', e.target.value)}
                                    maxLength={70}
                                    placeholder="Page title for search engines"
                                />
                                {errors.meta_title && (
                                    <p className="text-xs text-destructive">{errors.meta_title}</p>
                                )}
                            </div>

                            {/* Keywords */}
                            <div className="space-y-1.5">
                                <Label htmlFor="meta_keywords">Keywords</Label>
                                <Input
                                    id="meta_keywords"
                                    value={data.meta_keywords}
                                    onChange={(e) => setData('meta_keywords', e.target.value)}
                                    placeholder="keyword1, keyword2, keyword3"
                                />
                                <p className="text-[10px] text-muted-foreground">Comma-separated</p>
                                {errors.meta_keywords && (
                                    <p className="text-xs text-destructive">{errors.meta_keywords}</p>
                                )}
                            </div>
                        </div>

                        {/* Meta Description - full width */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="meta_description">Meta Description</Label>
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {data.meta_description.length}/170
                                </span>
                            </div>
                            <Textarea
                                id="meta_description"
                                value={data.meta_description}
                                onChange={(e) => setData('meta_description', e.target.value)}
                                maxLength={170}
                                rows={2}
                                placeholder="Brief description for search results"
                                className="resize-none"
                            />
                            {errors.meta_description && (
                                <p className="text-xs text-destructive">{errors.meta_description}</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 2: Social & Links */}
                    <TabsContent value="social" className="mt-4">
                        <div className="grid gap-4 lg:grid-cols-2 items-start">
                            {/* OG Image */}
                            <div className="space-y-2">
                                <Label>OG Image</Label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div
                                    className="relative aspect-video w-full rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 hover:bg-muted transition-colors overflow-hidden"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {ogPreview ? (
                                        <>
                                            <img
                                                src={ogPreview}
                                                alt="OG Image preview"
                                                className="absolute inset-0 w-full h-full object-cover"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 h-7 w-7 z-10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearOgImage();
                                                }}
                                            >
                                                <X className="size-3.5" />
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                                            <Upload className="size-8" />
                                            <span className="text-xs">Click to upload</span>
                                            <span className="text-[10px]">1200 × 630px recommended</span>
                                        </div>
                                    )}
                                </div>
                                {errors.og_image && (
                                    <p className="text-xs text-destructive">{errors.og_image}</p>
                                )}
                            </div>

                            {/* Canonical URL */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <Link2 className="size-3.5 text-muted-foreground" />
                                        <Label htmlFor="canonical_url">Canonical URL</Label>
                                    </div>
                                    <Input
                                        id="canonical_url"
                                        value={data.canonical_url}
                                        onChange={(e) => setData('canonical_url', e.target.value)}
                                        placeholder="https://example.com/page"
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        Leave empty to use the default page URL
                                    </p>
                                    {errors.canonical_url && (
                                        <p className="text-xs text-destructive">{errors.canonical_url}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 3: Advanced */}
                    <TabsContent value="advanced" className="mt-4 space-y-4">
                        <div className="grid gap-4 lg:grid-cols-2 items-start">
                            {/* Structured Data */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                    <Code2 className="size-3.5 text-muted-foreground" />
                                    <Label htmlFor="structured_data">Structured Data (JSON-LD)</Label>
                                </div>
                                <Textarea
                                    id="structured_data"
                                    value={data.structured_data}
                                    onChange={(e) => setData('structured_data', e.target.value)}
                                    rows={10}
                                    placeholder='{"@context": "https://schema.org", ...}'
                                    className="resize-y font-mono text-xs"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Add structured data for rich search results
                                </p>
                                {errors.structured_data && (
                                    <p className="text-xs text-destructive">{errors.structured_data}</p>
                                )}
                            </div>

                            {/* Indexing */}
                            <div className="rounded-lg border border-border p-4 space-y-3">
                                <p className="text-sm font-medium">Indexing</p>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="noindex" className="cursor-pointer text-sm font-normal">
                                            Prevent Indexing
                                        </Label>
                                        <p className="text-[10px] text-muted-foreground">
                                            Add noindex meta tag to this page
                                        </p>
                                    </div>
                                    <Switch
                                        id="noindex"
                                        checked={data.noindex}
                                        onCheckedChange={(checked) => setData('noindex', checked)}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </form>
        </AdminLayout>
    );
}
