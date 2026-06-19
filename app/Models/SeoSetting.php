<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeoSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_identifier',
        'meta_title',
        'meta_description',
        'og_image',
        'meta_keywords',
        'structured_data',
        'canonical_url',
        'noindex',
    ];

    protected function casts(): array
    {
        return [
            'meta_keywords' => 'array',
            'noindex' => 'boolean',
        ];
    }
}
