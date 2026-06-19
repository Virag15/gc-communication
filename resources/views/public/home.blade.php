@extends('public.layout')

@php
    $siteName = data_get($settings, 'site_name') ?: config('admin.name', 'GC Communication');
    $email = data_get($settings, 'contact_email');
    $phone = data_get($settings, 'contact_phone');
    $address = data_get($settings, 'contact_address');
    $logo = data_get($settings, 'org_logo') ?: '/images/gc-logo.svg';
    $year = date('Y');

    $brands = [
        ['name' => 'Kaycee', 'src' => '/images/brands/kaycee.png'],
        ['name' => 'Luker', 'src' => '/images/brands/luker.png'],
        ['name' => 'C&S Electric', 'src' => '/images/brands/cs-electric.png'],
        ['name' => 'BCH', 'src' => '/images/brands/bch.png'],
        ['name' => 'HPL', 'src' => '/images/brands/hpl.png'],
        ['name' => 'Suraj', 'src' => '/images/brands/suraj.png'],
    ];

    $categories = [
        ['title' => 'Switchgear & Protection', 'desc' => 'MCBs, RCCBs, distribution boards and industrial switchgear.'],
        ['title' => 'Wiring Accessories', 'desc' => 'Modular switches, sockets and plates for home and office.'],
        ['title' => 'Cables & Wires', 'desc' => 'FR/FRLS house wires and power cables from trusted brands.'],
        ['title' => 'Lighting', 'desc' => 'LED panels, battens, downlights and outdoor luminaires.'],
        ['title' => 'Industrial Controls', 'desc' => 'Contactors, relays, starters and control gear.'],
        ['title' => 'Solar & Energy', 'desc' => 'Solar-ready components and energy-efficient solutions.'],
    ];
@endphp

@section('content')
<header class="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="/" class="flex items-center gap-2">
            <img src="{{ $logo }}" alt="{{ $siteName }}" class="h-9 w-auto">
            <span class="text-lg font-extrabold tracking-tight">{{ $siteName }}</span>
        </a>
        <nav class="hidden items-center gap-8 text-sm font-medium text-neutral-600 md:flex">
            <a href="#brands" class="hover:text-neutral-900">Brands</a>
            <a href="#products" class="hover:text-neutral-900">Products</a>
            <a href="#about" class="hover:text-neutral-900">About</a>
            <a href="#contact" class="hover:text-neutral-900">Contact</a>
        </nav>
        <a href="#contact" class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">
            Get a quote
        </a>
    </div>
</header>

<main>
    {{-- Hero --}}
    <section class="relative overflow-hidden border-b border-neutral-200 bg-neutral-50">
        <div class="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
            <div>
                <span class="inline-block rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Authorised electrical distributor
                </span>
                <h1 class="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
                    Powering projects with <span class="text-brand-accent">trusted</span> electrical brands.
                </h1>
                <p class="mt-5 max-w-xl text-lg text-neutral-600">
                    {{ $siteName }} supplies switchgear, wiring, cables and lighting from India's leading
                    manufacturers — with reliable stock, fair pricing and expert support.
                </p>
                <div class="mt-8 flex flex-wrap gap-3">
                    <a href="#contact" class="rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800">
                        Contact sales
                    </a>
                    <a href="#brands" class="rounded-md border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
                        View brands
                    </a>
                </div>
            </div>
            <div class="flex justify-center lg:justify-end">
                <div class="flex h-64 w-64 items-center justify-center rounded-3xl border border-neutral-200 bg-white shadow-sm sm:h-80 sm:w-80">
                    <img src="{{ $logo }}" alt="{{ $siteName }}" class="h-40 w-auto">
                </div>
            </div>
        </div>
    </section>

    {{-- Brands --}}
    <section id="brands" class="border-b border-neutral-200 py-16">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <p class="text-center text-xs font-semibold uppercase tracking-widest text-neutral-500">
                Authorised distributor of
            </p>
            <div class="mt-8 grid grid-cols-2 items-center gap-4 sm:grid-cols-3 lg:grid-cols-6">
                @foreach($brands as $brand)
                    <div class="flex h-24 items-center justify-center rounded-xl border border-neutral-200 bg-white p-4">
                        <img src="{{ $brand['src'] }}" alt="{{ $brand['name'] }}" class="max-h-full max-w-full object-contain" loading="lazy">
                    </div>
                @endforeach
            </div>
        </div>
    </section>

    {{-- Products --}}
    <section id="products" class="border-b border-neutral-200 bg-neutral-50 py-20">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 class="text-3xl font-bold tracking-tight">What we supply</h2>
            <p class="mt-3 max-w-2xl text-neutral-600">A complete electrical range for residential, commercial and industrial projects.</p>
            <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                @foreach($categories as $cat)
                    <div class="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:shadow-md">
                        <div class="mb-4 h-1 w-10 rounded-full bg-brand-accent"></div>
                        <h3 class="text-lg font-semibold">{{ $cat['title'] }}</h3>
                        <p class="mt-2 text-sm text-neutral-600">{{ $cat['desc'] }}</p>
                    </div>
                @endforeach
            </div>
        </div>
    </section>

    {{-- About --}}
    <section id="about" class="border-b border-neutral-200 py-20">
        <div class="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-3">
            <div class="lg:col-span-1">
                <h2 class="text-3xl font-bold tracking-tight">Why {{ $siteName }}</h2>
                <p class="mt-3 text-neutral-600">Your dependable partner for genuine electrical products.</p>
            </div>
            <div class="grid gap-8 sm:grid-cols-2 lg:col-span-2">
                <div>
                    <h3 class="font-semibold">Genuine brands</h3>
                    <p class="mt-2 text-sm text-neutral-600">Authorised distribution means authentic products and full warranty support.</p>
                </div>
                <div>
                    <h3 class="font-semibold">Reliable stock</h3>
                    <p class="mt-2 text-sm text-neutral-600">Wide inventory and fast fulfilment so your projects stay on schedule.</p>
                </div>
                <div>
                    <h3 class="font-semibold">Fair pricing</h3>
                    <p class="mt-2 text-sm text-neutral-600">Competitive trade pricing for dealers, contractors and businesses.</p>
                </div>
                <div>
                    <h3 class="font-semibold">Expert support</h3>
                    <p class="mt-2 text-sm text-neutral-600">Guidance on selection, specification and bulk requirements.</p>
                </div>
            </div>
        </div>
    </section>

    {{-- Contact CTA --}}
    <section id="contact" class="bg-neutral-900 py-20 text-white">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <div class="grid gap-10 lg:grid-cols-2 lg:items-center">
                <div>
                    <h2 class="text-3xl font-bold tracking-tight">Let's talk about your requirement</h2>
                    <p class="mt-3 max-w-xl text-neutral-300">Send us your enquiry or product list and our team will get back to you quickly.</p>
                    @if($email)
                        <a href="mailto:{{ $email }}" class="mt-8 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100">
                            Email us
                        </a>
                    @endif
                </div>
                <div class="space-y-4 text-sm">
                    @if($phone)<p><span class="text-neutral-400">Phone:</span> <a class="font-medium hover:underline" href="tel:{{ $phone }}">{{ $phone }}</a></p>@endif
                    @if($email)<p><span class="text-neutral-400">Email:</span> <a class="font-medium hover:underline" href="mailto:{{ $email }}">{{ $email }}</a></p>@endif
                    @if($address)<p><span class="text-neutral-400">Address:</span> <span class="font-medium">{{ $address }}</span></p>@endif
                    @unless($phone || $email || $address)
                        <p class="text-neutral-400">Add your contact details in the admin → Site Settings.</p>
                    @endunless
                </div>
            </div>
        </div>
    </section>
</main>

<footer class="border-t border-neutral-200 py-10">
    <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div class="flex items-center gap-2">
            <img src="{{ $logo }}" alt="{{ $siteName }}" class="h-7 w-auto">
            <span class="text-sm font-semibold">{{ $siteName }}</span>
        </div>
        <div class="flex items-center gap-5 text-sm text-neutral-500">
            @if($fb = data_get($settings, 'social_facebook'))<a href="{{ $fb }}" class="hover:text-neutral-900" rel="noopener" target="_blank">Facebook</a>@endif
            @if($ig = data_get($settings, 'social_instagram'))<a href="{{ $ig }}" class="hover:text-neutral-900" rel="noopener" target="_blank">Instagram</a>@endif
            @if($li = data_get($settings, 'social_linkedin'))<a href="{{ $li }}" class="hover:text-neutral-900" rel="noopener" target="_blank">LinkedIn</a>@endif
        </div>
        <p class="text-xs text-neutral-400">&copy; {{ $year }} {{ $siteName }}. All rights reserved.</p>
    </div>
</footer>
@endsection
