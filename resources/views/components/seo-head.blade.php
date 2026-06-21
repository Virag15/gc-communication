@props(['seo' => null, 'settings' => [], 'title' => null, 'description' => null])
@php
    $siteName = data_get($settings, 'site_name') ?: config('admin.name', 'GC Communication');
    $metaTitle = ($seo?->meta_title) ?: ($title ?: (data_get($settings, 'default_meta_title') ?: $siteName));
    $metaDescription = ($seo?->meta_description) ?: ($description ?: data_get($settings, 'default_meta_description'));
    $canonical = ($seo?->canonical_url) ?: url()->current();
    $noindex = (bool) ($seo?->noindex);
    $keywords = ($seo && is_array($seo->meta_keywords)) ? implode(', ', $seo->meta_keywords) : null;
    $ogTitle = ($seo?->og_title) ?: $metaTitle;
    $ogDescription = ($seo?->og_description) ?: $metaDescription;
    $ogType = ($seo?->og_type) ?: 'website';
    $robots = ($seo?->robots) ?: ($noindex ? 'noindex, nofollow' : 'index, follow');
    if (!str_contains($robots, 'noindex')) {
        $robots .= ', max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    }

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

    if ($addr = data_get($settings, 'contact_address')) {
        $jsonLd['address'] = ['@type' => 'PostalAddress', 'streetAddress' => $addr, 'addressCountry' => 'IN'];
    }

    // WebSite entity helps Google + AI assistants understand the site as a whole.
    $websiteLd = [
        '@context' => 'https://schema.org',
        '@type' => 'WebSite',
        'name' => $siteName,
        'url' => url('/'),
    ];

    // Article schema + OG article tags for blog posts (og:type = article).
    $isArticle = $ogType === 'article';
    $artPub = ($isArticle && $seo?->published_at) ? $seo->published_at->toAtomString() : null;
    $artMod = ($isArticle && $seo?->updated_at) ? $seo->updated_at->toAtomString() : null;
    $artAuthor = $isArticle ? ($seo->author ?? null) : null;
    $articleLd = $isArticle ? array_filter([
        '@context' => 'https://schema.org',
        '@type' => 'Article',
        'headline' => $ogTitle,
        'description' => $ogDescription,
        'image' => $ogImageUrl,
        'datePublished' => $artPub,
        'dateModified' => $artMod ?: $artPub,
        'author' => ['@type' => $artAuthor ? 'Person' : 'Organization', 'name' => $artAuthor ?: $siteName],
        'publisher' => ['@type' => 'Organization', 'name' => $siteName, 'logo' => ['@type' => 'ImageObject', 'url' => $toUrl(data_get($settings, 'org_logo') ?: '/images/gc-logo.png')]],
        'mainEntityOfPage' => $canonical,
    ], fn ($v) => !empty($v)) : null;
@endphp
<title>{{ $metaTitle }}</title>
@if($metaDescription)<meta name="description" content="{{ $metaDescription }}">@endif
@if($keywords)<meta name="keywords" content="{{ $keywords }}">@endif
<link rel="canonical" href="{{ $canonical }}">
<meta name="robots" content="{{ $robots }}">
<meta name="theme-color" content="#3f6ad6">

{{-- Open Graph --}}
<meta property="og:type" content="{{ $ogType }}">
<meta property="og:site_name" content="{{ $siteName }}">
<meta property="og:title" content="{{ $ogTitle }}">
@if($ogDescription)<meta property="og:description" content="{{ $ogDescription }}">@endif
<meta property="og:url" content="{{ $canonical }}">
<meta property="og:image" content="{{ $ogImageUrl }}">
<meta property="og:image:alt" content="{{ $ogTitle }}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_IN">
@if($isArticle)
@if($artPub)<meta property="article:published_time" content="{{ $artPub }}">@endif
@if($artMod)<meta property="article:modified_time" content="{{ $artMod }}">@endif
@if($artAuthor)<meta property="article:author" content="{{ $artAuthor }}">@endif
@endif

{{-- Twitter --}}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ $ogTitle }}">
@if($ogDescription)<meta name="twitter:description" content="{{ $ogDescription }}">@endif
<meta name="twitter:image" content="{{ $ogImageUrl }}">
<meta name="twitter:image:alt" content="{{ $ogTitle }}">
@if($twitter = data_get($settings, 'social_twitter'))<meta name="twitter:site" content="{{ $twitter }}">@endif

{{-- Search-engine verification --}}
@if($gsv = data_get($settings, 'google_site_verification'))<meta name="google-site-verification" content="{{ $gsv }}">@endif
@if($bing = data_get($settings, 'bing_site_verification'))<meta name="msvalidate.01" content="{{ $bing }}">@endif

{{-- Structured data (Google rich results + AI assistants) --}}
<script type="application/ld+json">{!! json_encode($jsonLd, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
<script type="application/ld+json">{!! json_encode($websiteLd, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
@if($articleLd)
<script type="application/ld+json">{!! json_encode($articleLd, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
@endif
@if($seo?->structured_data)
<script type="application/ld+json">{!! $seo->structured_data !!}</script>
@endif
