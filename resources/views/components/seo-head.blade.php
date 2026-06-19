@props(['seo' => null, 'settings' => [], 'title' => null, 'description' => null])
@php
    $siteName = data_get($settings, 'site_name') ?: config('admin.name', 'GC Communication');
    $metaTitle = ($seo?->meta_title) ?: ($title ?: (data_get($settings, 'default_meta_title') ?: $siteName));
    $metaDescription = ($seo?->meta_description) ?: ($description ?: data_get($settings, 'default_meta_description'));
    $canonical = ($seo?->canonical_url) ?: url()->current();
    $noindex = (bool) ($seo?->noindex);
    $keywords = ($seo && is_array($seo->meta_keywords)) ? implode(', ', $seo->meta_keywords) : null;

    $toUrl = fn ($path) => $path ? (\Illuminate\Support\Str::startsWith($path, ['http://', 'https://']) ? $path : url($path)) : null;
    $ogImageUrl = $toUrl(($seo?->og_image) ?: (data_get($settings, 'default_og_image') ?: data_get($settings, 'org_logo')))
        ?: asset('images/gc-logo.png');

    $sameAs = array_values(array_filter([
        data_get($settings, 'social_facebook'),
        data_get($settings, 'social_instagram'),
        data_get($settings, 'social_linkedin'),
    ]));

    $jsonLd = array_filter([
        '@context' => 'https://schema.org',
        '@type' => 'Organization',
        'name' => $siteName,
        'url' => url('/'),
        'logo' => $toUrl(data_get($settings, 'org_logo') ?: '/images/gc-logo.png'),
        'email' => data_get($settings, 'contact_email'),
        'telephone' => data_get($settings, 'contact_phone'),
        'sameAs' => $sameAs ?: null,
    ], fn ($v) => !empty($v));
@endphp
<title>{{ $metaTitle }}</title>
@if($metaDescription)<meta name="description" content="{{ $metaDescription }}">@endif
@if($keywords)<meta name="keywords" content="{{ $keywords }}">@endif
<link rel="canonical" href="{{ $canonical }}">
<meta name="robots" content="{{ $noindex ? 'noindex, nofollow' : 'index, follow' }}">

{{-- Open Graph --}}
<meta property="og:type" content="website">
<meta property="og:site_name" content="{{ $siteName }}">
<meta property="og:title" content="{{ $metaTitle }}">
@if($metaDescription)<meta property="og:description" content="{{ $metaDescription }}">@endif
<meta property="og:url" content="{{ $canonical }}">
<meta property="og:image" content="{{ $ogImageUrl }}">

{{-- Twitter --}}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ $metaTitle }}">
@if($metaDescription)<meta name="twitter:description" content="{{ $metaDescription }}">@endif
<meta name="twitter:image" content="{{ $ogImageUrl }}">

{{-- Search-engine verification --}}
@if($gsv = data_get($settings, 'google_site_verification'))<meta name="google-site-verification" content="{{ $gsv }}">@endif
@if($bing = data_get($settings, 'bing_site_verification'))<meta name="msvalidate.01" content="{{ $bing }}">@endif

{{-- Structured data --}}
<script type="application/ld+json">{!! json_encode($jsonLd, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
@if($seo?->structured_data)
<script type="application/ld+json">{!! $seo->structured_data !!}</script>
@endif
