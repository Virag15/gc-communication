<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route middleware (auth + AdminOnly) handles access control.
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:120',
            'customer' => 'nullable|string|max:160',
            'material' => 'required|in:W,P',
            'width_ft' => 'required|numeric|min:0.1|max:1000',
            'height_ft' => 'required|numeric|min:0.1|max:100',
            'lsps_fixed' => 'required|integer|min:0|max:50',
            'lsps_movable' => 'required|integer|min:0|max:50',
            'ssps_fixed' => 'required|integer|min:0|max:50',
            'ssps_movable' => 'required|integer|min:0|max:50',
            'line_items' => 'required|array|min:1',
            'line_items.*.system' => 'required|in:LSPS,SSPS',
            'line_items.*.name' => 'required|string|max:255',
            'line_items.*.code' => 'nullable|string|max:60',
            'line_items.*.finish' => 'nullable|string|max:60',
            'line_items.*.qty' => 'required|numeric|min:0|max:100000',
            'line_items.*.mrp' => 'required|numeric|min:0|max:10000000',
            'line_items.*.custom' => 'nullable|boolean',
            'template' => 'nullable|string|max:40',
            'accent' => 'nullable|string|max:20',
            'notes' => 'nullable|string|max:2000',
        ];
    }
}
