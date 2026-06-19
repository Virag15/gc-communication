<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEnquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'    => 'required|string|max:160',
            'email'   => 'required|email|max:255',
            'phone'   => 'nullable|string|max:40',
            'company' => 'nullable|string|max:160',
            'message' => 'required|string|max:5000',
        ];
    }
}
