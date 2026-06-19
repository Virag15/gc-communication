<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route middleware (auth + AdminOnly) handles access control.
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:200',
            'slug' => 'nullable|string|max:220',
            'excerpt' => 'nullable|string|max:300',
            'body' => 'nullable|string|max:100000',
            'cover_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'author' => 'nullable|string|max:120',
            'status' => 'required|in:draft,published',
            'published_at' => 'nullable|date',
            'meta_title' => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:200',
            'meta_keywords' => 'nullable|string|max:500',
            'og_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'noindex' => 'boolean',
        ];
    }
}
