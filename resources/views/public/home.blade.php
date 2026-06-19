@extends('public.layout')

@php
    $navOverHero = true;
    $eyebrow = data_get($settings, 'hero_eyebrow') ?: 'Authorised low-voltage switchgear distributor';
    $headline = data_get($settings, 'hero_headline') ?: 'The right switchgear on the shelf — and out the same day.';
    $subtext = data_get($settings, 'hero_subtext') ?: 'Six principal brands held deep across Nashik & Jalgaon. Deep stock, same-day dispatch, and one accountable vendor from PO to delivery.';
    $heroImage = data_get($settings, 'hero_image');
    $sinceYear = data_get($settings, 'since_year') ?: '2013';
    $locations = data_get($settings, 'locations') ?: 'Nashik & Jalgaon';
@endphp

@section('content')
{{-- ============================ Hero ============================ --}}
<section class="relative flex min-h-[92vh] items-center overflow-hidden bg-neutral-950 text-white">
    @if ($heroImage)
        <img src="{{ $heroImage }}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-30">
        <div class="absolute inset-0" style="background: linear-gradient(to bottom, rgba(10,10,10,.55), rgba(10,10,10,.75) 55%, #0a0a0a);"></div>
    @endif
    {{-- subtle monochrome glow --}}
    <div class="absolute inset-0" style="background: radial-gradient(ellipse at 72% 22%, rgba(255,255,255,.10), transparent 55%);"></div>

    <div class="relative mx-auto w-full max-w-7xl px-6 lg:px-8">
        <span class="inline-flex items-center rounded-full border border-white/20 px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
            {{ $eyebrow }}
        </span>
        <h1 class="mt-7 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
            {{ $headline }}
        </h1>
        <p class="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">{{ $subtext }}</p>
        <div class="mt-10 flex flex-wrap items-center gap-3">
            <a href="{{ route('contact') }}" class="inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-semibold text-neutral-950 transition hover:bg-white/90">
                Get a quote
            </a>
            <a href="{{ route('catalogues') }}" class="inline-flex h-12 items-center rounded-full border border-white/25 px-7 text-sm font-semibold text-white transition hover:bg-white/10">
                Browse catalogues
            </a>
        </div>
        <p class="mt-10 text-sm text-white/40">Distributors since {{ $sinceYear }} · {{ $locations }}</p>
    </div>

    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.2em] text-white/40">Scroll</div>
</section>

{{-- The remaining homepage sections (brand strip, what we do, range, why GC,
     stats, process, who we serve, enquiry) are being rebuilt next, one at a time. --}}
@endsection
