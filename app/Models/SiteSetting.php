<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Dynamic, admin-editable site-wide settings (analytics IDs, verification
 * codes, SEO defaults, contact details). Stored as a simple key/value table
 * and cached as a single map so the public pages read them with no query cost.
 */
class SiteSetting extends Model
{
    protected $fillable = ['key', 'value'];

    public const CACHE_KEY = 'site_settings.map';

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget(self::CACHE_KEY));
        static::deleted(fn () => Cache::forget(self::CACHE_KEY));
    }

    /** All settings as a cached key => value map. */
    public static function map(): array
    {
        return Cache::rememberForever(
            self::CACHE_KEY,
            fn () => static::query()->pluck('value', 'key')->all()
        );
    }

    /** Get a setting value, falling back to $default when missing/blank. */
    public static function get(string $key, ?string $default = null): ?string
    {
        $value = self::map()[$key] ?? null;

        return ($value === null || $value === '') ? $default : $value;
    }

    /** Get a setting as a boolean. */
    public static function boolean(string $key, bool $default = false): bool
    {
        $value = self::map()[$key] ?? null;

        return $value === null ? $default : filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    /** Create or update a single setting. */
    public static function put(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
