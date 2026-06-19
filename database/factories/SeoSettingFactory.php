<?php

namespace Database\Factories;

use App\Models\SeoSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SeoSetting>
 */
class SeoSettingFactory extends Factory
{
    protected $model = SeoSetting::class;

    public function definition(): array
    {
        return [
            'page_identifier' => fake()->randomElement(['home', 'services', 'contact', 'about', 'blog']),
            'meta_title' => fake()->sentence(4),
            'meta_description' => fake()->sentence(10),
            'meta_keywords' => ['surgery', 'robotic', 'cancer'],
            'noindex' => false,
        ];
    }
}
