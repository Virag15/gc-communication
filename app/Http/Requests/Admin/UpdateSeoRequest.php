<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSeoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'meta_title'       => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:170',
            'og_image'         => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'meta_keywords'    => 'nullable|string|max:500',
            'structured_data'  => 'nullable|string|max:5000',
            'canonical_url'    => 'nullable|url|max:500',
            'noindex'          => 'boolean',
        ];
    }
}
