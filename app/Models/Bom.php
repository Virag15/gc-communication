<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bom extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'customer',
        'material',
        'width_ft',
        'height_ft',
        'lsps_fixed',
        'lsps_movable',
        'ssps_fixed',
        'ssps_movable',
        'line_items',
        'lsps_total',
        'ssps_total',
        'grand_total',
        'template',
        'accent',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'line_items' => 'array',
            'width_ft' => 'float',
            'height_ft' => 'float',
            'lsps_fixed' => 'integer',
            'lsps_movable' => 'integer',
            'ssps_fixed' => 'integer',
            'ssps_movable' => 'integer',
            'lsps_total' => 'float',
            'ssps_total' => 'float',
            'grand_total' => 'float',
        ];
    }
}
