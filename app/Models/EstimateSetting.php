<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EstimateSetting extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'valid_days' => 'integer',
            'gst_pct' => 'integer',
            'photos' => 'boolean',
            'show_prices' => 'boolean',
            'show_scheme' => 'boolean',
            'use_brand_logos' => 'boolean',
        ];
    }

    /** The single global settings row, created with defaults on first access. */
    public static function current(): self
    {
        return static::firstOrCreate(['id' => 1]);
    }
}
