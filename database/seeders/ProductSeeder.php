<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'item_no' => 'MCB-32',
                'name' => 'Miniature Circuit Breaker 32A',
                'spec' => '32A · C-curve · 1P · 10kA',
                'price' => 380,
                'mrp' => 520,
                'category' => 'MCB',
                'bulk' => '10+ @ 350',
            ],
            [
                'item_no' => 'MCCB-100',
                'name' => 'Moulded Case Circuit Breaker 100A',
                'spec' => '100A · 3P · 25kA · thermal-magnetic',
                'price' => 4250,
                'mrp' => 5600,
                'category' => 'MCCB',
                'bulk' => '5+ @ 3950',
            ],
            [
                'item_no' => 'RCCB-40',
                'name' => 'Residual Current Circuit Breaker 40A',
                'spec' => '40A · 2P · 30mA · Type AC',
                'price' => 1450,
                'mrp' => 1980,
                'category' => 'RCCB',
                'bulk' => null,
            ],
            [
                'item_no' => 'DB-8W',
                'name' => 'Distribution Board 8-Way',
                'spec' => '8-way · SPN · double-door · metal',
                'price' => 1850,
                'mrp' => 2400,
                'category' => 'Distribution Board',
                'bulk' => '10+ @ 1700',
            ],
            [
                'item_no' => 'COS-63',
                'name' => 'Changeover Switch 63A',
                'spec' => '63A · 4P · manual · 415V',
                'price' => 2200,
                'mrp' => 2950,
                'category' => 'Changeover Switch',
                'bulk' => null,
            ],
            [
                'item_no' => 'SOCK-32',
                'name' => 'Industrial Socket 32A',
                'spec' => '32A · 3P+N+E · IP67 · 415V',
                'price' => 640,
                'mrp' => 890,
                'category' => 'Industrial Socket',
                'bulk' => '20+ @ 590',
            ],
        ];

        foreach ($products as $i => $product) {
            Product::updateOrCreate(
                ['item_no' => $product['item_no']],
                [
                    'name' => $product['name'],
                    'spec' => $product['spec'],
                    'price' => $product['price'],
                    'mrp' => $product['mrp'],
                    'category' => $product['category'],
                    'bulk' => $product['bulk'],
                    'sort_order' => $i,
                    'is_active' => true,
                ]
            );
        }
    }
}
