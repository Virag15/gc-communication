import { useRef, useMemo, useEffect } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from '@/components/RichTextEditor';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, Save, Upload, Image as ImageIcon } from 'lucide-react';
import type { Post } from '@/types';

interface Form {
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    cover_image: File | null;
    author: string;
    status: string;
    published_at: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    og_image: File | null;
    noindex: boolean;
}

export default function PostForm({ post }: { post?: Post }) {
    const isEdit = !!post;
    const fileRef = useRef<HTMLInputElement>(null);
    const ogRef = useRef<HTMLInputElement>(null);

    const { data, setData, post: submit, processing, errors } = useForm<Form>({
        title: post?.title ?? '',
        slug: post?.slug ?? '',
        excerpt: post?.excerpt ?? '',
        body: post?.body ?? '',
        cover_image: null,
        author: post?.author ?? '',
        status: post?.status ?? 'draft',
        published_at: post?.published_at ? post.published_at.slice(0, 10) : '',
        meta_title: post?.meta_title ?? '',
        meta_description: post?.meta_description ?? '',
        meta_keywords: Array.isArray(post?.meta_keywords) ? post!.meta_keywords!.join(', ') : '',
        og_image: null,
        noindex: post?.noindex ?? false,
    });
    const E = errors as Record<string, string>;

    const coverPreview = useMemo(() => (data.cover_image ? URL.createObjectURL(data.cover_image) : post?.cover_image ?? null), [data.cover_image, post?.cover_image]);
    useEffect(() => () => { if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview); }, [coverPreview]);

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!data.title.trim()) return toast.error('Add a title.');
        submit(isEdit ? `/admin/blog/${post!.id}` : '/admin/blog', {
            forceFormData: true,
            onSuccess: () => toast.success(isEdit ? 'Post updated.' : 'Post saved.'),
            onError: () => toast.error('Please fix the errors and try again.'),
        });
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="ghost" size="sm"><Link href="/admin/blog"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>
                <h1 className="text-xl font-bold tracking-tight">{isEdit ? 'Edit post' : 'New post'}</h1>
                <Button type="submit" disabled={processing} className="ml-auto">{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {isEdit ? 'Update' : 'Save'}</Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Post title" />
                        {E.title && <p className="text-xs text-destructive">{E.title}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" value={data.slug} onChange={(e) => setData('slug', e.target.value)} placeholder="auto-generated-from-title" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="excerpt">Excerpt</Label>
                        <Textarea id="excerpt" rows={2} value={data.excerpt} onChange={(e) => setData('excerpt', e.target.value)} placeholder="Short summary shown in listings and search results" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Content</Label>
                        <RichTextEditor value={data.body} onChange={(html) => setData('body', html)} placeholder="Write the post..." />
                    </div>
                </div>

                <aside className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Publish</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label htmlFor="published_at">Publish date</Label><DatePicker id="published_at" value={data.published_at || null} onChange={(d) => setData('published_at', format(d, 'yyyy-MM-dd'))} placeholder="Pick a date" /></div>
                            <div className="space-y-1.5"><Label htmlFor="author">Author</Label><Input id="author" value={data.author} onChange={(e) => setData('author', e.target.value)} /></div>
                            <div className="space-y-1.5">
                                <Label>Cover image</Label>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                                        {coverPreview ? <img src={coverPreview} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                    <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => setData('cover_image', e.target.files?.[0] ?? null)} />
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5" /> {data.cover_image ? 'Change' : 'Upload'}</Button>
                                </div>
                                {E.cover_image && <p className="text-xs text-destructive">{E.cover_image}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">SEO</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5"><Label htmlFor="meta_title">Meta title</Label><Input id="meta_title" value={data.meta_title} onChange={(e) => setData('meta_title', e.target.value)} placeholder={data.title || 'Defaults to title'} /></div>
                            <div className="space-y-1.5"><Label htmlFor="meta_description">Meta description</Label><Textarea id="meta_description" rows={2} value={data.meta_description} onChange={(e) => setData('meta_description', e.target.value)} placeholder={data.excerpt || 'Defaults to excerpt'} /></div>
                            <div className="space-y-1.5"><Label htmlFor="meta_keywords">Keywords (comma separated)</Label><Input id="meta_keywords" value={data.meta_keywords} onChange={(e) => setData('meta_keywords', e.target.value)} placeholder="switchgear, mcb, ..." /></div>
                            <div className="space-y-1.5">
                                <Label>Social image (OG)</Label>
                                <input ref={ogRef} type="file" accept="image/*" className="sr-only" onChange={(e) => setData('og_image', e.target.files?.[0] ?? null)} />
                                <Button type="button" variant="outline" size="sm" onClick={() => ogRef.current?.click()}><Upload className="h-3.5 w-3.5" /> {data.og_image ? data.og_image.name : (post?.og_image ? 'Replace image' : 'Upload (defaults to cover)')}</Button>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <div><Label htmlFor="noindex">Hide from search</Label><p className="text-xs text-muted-foreground">noindex, nofollow</p></div>
                                <Switch id="noindex" checked={data.noindex} onCheckedChange={(v) => setData('noindex', v)} />
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </form>
    );
}
