<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'item_no', 'name', 'spec', 'price', 'mrp', 'brand_id', 'category', 'bulk', 'image', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'mrp' => 'float',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'brand_id' => 'integer',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}
