<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PostRequest;
use App\Models\Post;
use App\Traits\Auditable;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PostController extends Controller
{
    use Auditable;

    public function index()
    {
        $posts = Post::latestFirst()->get(['id', 'title', 'slug', 'status', 'published_at', 'updated_at']);

        return Inertia::render('Admin/Posts/Index', [
            'posts' => $posts,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Posts/Create');
    }

    public function store(PostRequest $request)
    {
        $post = Post::create($this->persist($request));
        $this->audit('created', $post);

        return redirect()->route('admin.blog.index')->with('success', 'Post saved successfully.');
    }

    public function edit(int $id)
    {
        $post = Post::findOrFail($id);

        return Inertia::render('Admin/Posts/Edit', [
            'post' => $post,
        ]);
    }

    public function update(PostRequest $request, int $id)
    {
        $post = Post::findOrFail($id);
        $post->update($this->persist($request, $post));
        $this->audit('updated', $post);

        return redirect()->route('admin.blog.index')->with('success', 'Post updated successfully.');
    }

    public function destroy(int $id)
    {
        $post = Post::findOrFail($id);
        $post->delete();
        $this->audit('deleted', $post);

        return redirect()->route('admin.blog.index')->with('success', 'Post deleted.');
    }

    private function persist(PostRequest $request, ?Post $post = null): array
    {
        $v = $request->validated();
        $base = ! empty($v['slug']) ? $v['slug'] : $v['title'];

        $payload = [
            'title' => $v['title'],
            'slug' => $this->uniqueSlug($base, $post?->id),
            'excerpt' => $v['excerpt'] ?? null,
            'body' => $v['body'] ?? null,
            'author' => $v['author'] ?? null,
            'status' => $v['status'],
            'published_at' => $v['published_at'] ?? $post?->published_at ?? ($v['status'] === 'published' ? now() : null),
            'meta_title' => $v['meta_title'] ?? null,
            'meta_description' => $v['meta_description'] ?? null,
            'meta_keywords' => ! empty($v['meta_keywords'])
                ? array_values(array_filter(array_map(fn ($k) => trim($k), explode(',', $v['meta_keywords']))))
                : [],
            'noindex' => filter_var($request->input('noindex'), FILTER_VALIDATE_BOOLEAN),
        ];

        if ($request->hasFile('cover_image')) {
            $payload['cover_image'] = '/storage/' . $request->file('cover_image')->store('posts', 'public');
        }
        if ($request->hasFile('og_image')) {
            $payload['og_image'] = '/storage/' . $request->file('og_image')->store('posts', 'public');
        }

        return $payload;
    }

    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base) ?: 'post';
        $orig = $slug;
        $i = 2;
        while (Post::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $orig . '-' . $i++;
        }

        return $slug;
    }
}
