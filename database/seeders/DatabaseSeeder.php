<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Idempotent seeding so it is safe to run on first Docker boot (APP_SEED=true)
        // and again later without violating the unique-email constraint.
        // Override the defaults via SEED_ADMIN_* environment variables.
        User::updateOrCreate(
            ['email' => env('SEED_ADMIN_EMAIL', 'admin@gc-communication.in')],
            [
                'name' => env('SEED_ADMIN_NAME', 'GC Administrator'),
                'password' => Hash::make(env('SEED_ADMIN_PASSWORD', 'password')),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => env('SEED_EDITOR_EMAIL', 'editor@gc-communication.in')],
            [
                'name' => env('SEED_EDITOR_NAME', 'GC Editor'),
                'password' => Hash::make(env('SEED_EDITOR_PASSWORD', 'password')),
                'role' => 'editor',
                'is_active' => true,
            ]
        );
    }
}
