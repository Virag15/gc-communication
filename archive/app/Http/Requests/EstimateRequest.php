<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EstimateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route middleware (auth + AdminOnly) handles access control.
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'nullable|integer|exists:customers,id',
            'customer' => 'required|array',
            'customer.name' => 'required|string|max:160',
            'customer.company' => 'nullable|string|max:160',
            'customer.phone' => 'nullable|string|max:40',
            'customer.email' => 'nullable|string|max:160',
            'customer.address' => 'nullable|string|max:400',
            'customer.gstin' => 'nullable|string|max:20',
            'customer.ref_by' => 'nullable|string|max:160',

            'line_items' => 'required|array|min:1',
            'line_items.*.product_id' => 'nullable|integer',
            'line_items.*.item_no' => 'nullable|string|max:60',
            'line_items.*.name' => 'required|string|max:255',
            'line_items.*.spec' => 'nullable|string|max:200',
            'line_items.*.qty' => 'required|numeric|min:0|max:100000',
            'line_items.*.unit_price' => 'required|numeric|min:0|max:100000000',
            'line_items.*.mrp' => 'nullable|numeric|min:0',
            'line_items.*.image' => 'nullable|string|max:500',

            'special_discount' => 'nullable|numeric|min:0',
            'delivery_fee' => 'nullable|numeric|min:0',
            'express' => 'boolean',
            'gst_pct' => 'nullable|integer|in:0,5,12,18,28',
            'show_prices' => 'boolean',
            'show_scheme' => 'boolean',
            'template' => 'required|in:classic,bold,studio',
            'accent' => 'nullable|string|max:20',
        ];
    }
}
