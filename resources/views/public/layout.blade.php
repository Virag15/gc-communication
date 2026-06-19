<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Analytics / marketing (dynamic, managed in admin → Site Settings) --}}
    <x-tracking-head :settings="$settings ?? []" />

    {{-- SEO meta, Open Graph, Twitter, verification, JSON-LD --}}
    <x-seo-head :seo="$seo ?? null" :settings="$settings ?? []" :title="$title ?? null" :description="$description ?? null" />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800" rel="stylesheet" />

    @vite(['resources/css/app.css', 'resources/js/app.ts'])

    {{-- Arbitrary head code from admin → Site Settings (trusted) --}}
    @if($head = data_get($settings ?? [], 'custom_head_html'))
        {!! $head !!}
    @endif
</head>
<body class="font-sans antialiased bg-white text-neutral-900">
    {{-- GTM / Meta Pixel noscript fallbacks --}}
    <x-tracking-body :settings="$settings ?? []" />

    <x-public.navbar />

    <main class="pt-[var(--nav-h)]">
        @yield('content')
    </main>

    <x-public.footer />

    <x-cookie-consent :settings="$settings ?? []" />

    {{-- Arbitrary end-of-body code from admin → Site Settings (trusted) --}}
    @if($body = data_get($settings ?? [], 'custom_body_html'))
        {!! $body !!}
    @endif
</body>
</html>
