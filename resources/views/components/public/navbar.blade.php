@props(['overHero' => false])

@php
    $settings = \App\Models\SiteSetting::map();
    $siteName = data_get($settings, 'site_name') ?: config('admin.name', 'GC Communication');

    $links = [
        ['label' => 'Brands', 'route' => 'brands'],
        ['label' => 'Range', 'route' => 'range'],
        ['label' => 'Catalogues', 'route' => 'catalogues'],
        ['label' => 'About', 'route' => 'about'],
        ['label' => 'Contact', 'route' => 'contact'],
    ];
@endphp

<nav class="site-nav fixed inset-x-0 top-0 z-50 {{ $overHero ? '' : 'is-solid' }}"
     data-solid="{{ $overHero ? 'auto' : 'static' }}"
     aria-label="Primary">
    <div class="mx-auto flex h-[var(--nav-h)] max-w-7xl items-center justify-between px-6 lg:px-8">
        {{-- Brand --}}
        <a href="{{ route('home') }}" class="flex items-center gap-2.5">
            <img src="/images/gc-logo.svg" alt="" aria-hidden="true" class="site-nav__logo h-7 w-auto">
            <span class="text-[15px] font-semibold tracking-tight">{{ $siteName }}</span>
        </a>

        {{-- Desktop links --}}
        <div class="hidden items-center gap-9 lg:flex">
            @foreach ($links as $link)
                <a href="{{ route($link['route']) }}"
                   class="site-nav__link {{ request()->routeIs($link['route']) ? 'is-active' : '' }}">
                    {{ $link['label'] }}
                </a>
            @endforeach
        </div>

        {{-- CTA + mobile toggle --}}
        <div class="flex items-center gap-2">
            <a href="{{ route('contact') }}" class="site-nav__cta hidden sm:inline-flex">Get a quote</a>
            <button type="button" class="site-nav__burger lg:hidden" data-nav-toggle
                    aria-label="Open menu" aria-expanded="false" aria-controls="site-mobile-menu">
                <span></span><span></span>
            </button>
        </div>
    </div>
</nav>

{{-- Mobile overlay menu --}}
<div id="site-mobile-menu" class="site-nav__mobile lg:hidden" data-nav-menu>
    <div class="site-nav__mobile-head">
        <a href="{{ route('home') }}" class="flex items-center gap-2.5">
            <img src="/images/gc-logo.svg" alt="" aria-hidden="true" class="h-7 w-auto">
            <span class="text-[15px] font-semibold tracking-tight">{{ $siteName }}</span>
        </a>
        <button type="button" class="site-nav__close" data-nav-close aria-label="Close menu">&times;</button>
    </div>
    <nav class="site-nav__mobile-links" aria-label="Mobile">
        @foreach ($links as $link)
            <a href="{{ route($link['route']) }}">{{ $link['label'] }}</a>
        @endforeach
        <a href="{{ route('contact') }}" class="site-nav__mobile-cta">Get a quote</a>
    </nav>
</div>
