<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Estimate extends Model
{
    use HasFactory;

    protected $fillable = [
        'estimate_no',
        'customer_id',
        'customer',
        'line_items',
        'special_discount',
        'delivery_fee',
        'express',
        'gst_pct',
        'show_prices',
        'show_scheme',
        'template',
        'accent',
        'item_total',
        'scheme_off',
        'gst_amt',
        'grand_total',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'customer' => 'array',
            'line_items' => 'array',
            'special_discount' => 'float',
            'delivery_fee' => 'float',
            'express' => 'boolean',
            'gst_pct' => 'integer',
            'show_prices' => 'boolean',
            'show_scheme' => 'boolean',
            'item_total' => 'float',
            'scheme_off' => 'float',
            'gst_amt' => 'float',
            'grand_total' => 'float',
        ];
    }

    public function customerModel(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
}
