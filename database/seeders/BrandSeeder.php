<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            ['name' => 'C&S Electric Limited', 'logo' => '/images/brands/cs-electric.png', 'description' => 'MCBs, MCCBs, RCCBs, switch-disconnectors and busbar trunking - the backbone of most LT panels we supply.'],
            ['name' => 'BCH Electric Limited', 'logo' => '/images/brands/bch.png', 'description' => 'Contactors, overload relays, motor starters, timers and push-button stations from a long-established Indian control-gear maker.'],
            ['name' => 'HPL Electric & Power Limited', 'logo' => '/images/brands/hpl.png', 'description' => 'Switchgear, modular switches, wires & cables, LED lighting and energy meters from a major Indian electrical manufacturer.'],
            ['name' => 'Suraj', 'logo' => '/images/brands/suraj.png', 'description' => 'Switch-disconnectors, changeover switches, HRC fuses and feeder pillars - switching and protection for distribution boards.'],
            ['name' => 'Luker Electric Technologies', 'logo' => '/images/brands/luker.png', 'description' => 'Industrial and residential lighting and fans - the LED luminaires and fan range for site and building use.'],
            ['name' => 'Kaycee Industries Limited', 'logo' => '/images/brands/kaycee.png', 'description' => 'Rotary and selector switches, cam switches, indicating meters and control-station gear for panels and machines.'],
        ];

        foreach ($brands as $i => $brand) {
            Brand::updateOrCreate(
                ['slug' => Str::slug($brand['name'])],
                [
                    'name' => $brand['name'],
                    'description' => $brand['description'],
                    'logo' => $brand['logo'],
                    'sort_order' => $i,
                    'is_active' => true,
                ]
            );
        }
    }
}
