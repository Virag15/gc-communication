<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'body',
        'cover_image',
        'author',
        'status',
        'published_at',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'og_image',
        'noindex',
    ];

    protected function casts(): array
    {
        return [
            'meta_keywords' => 'array',
            'noindex' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('published_at')->orWhere('published_at', '<=', now());
            });
    }

    public function scopeLatestFirst(Builder $query): Builder
    {
        return $query->orderByDesc('published_at')->orderByDesc('id');
    }

    /** Open Graph type for the public SEO head. */
    public function getOgTypeAttribute(): string
    {
        return 'article';
    }
}
