@extends('public.layout')

@php
    $eyebrow = data_get($settings, 'hero_eyebrow') ?: 'Authorised low-voltage switchgear distributor';
    $headline = data_get($settings, 'hero_headline') ?: 'The right switchgear on the shelf — and out the same day.';
    $subtext = data_get($settings, 'hero_subtext') ?: 'Six principal brands held deep across Nashik & Jalgaon. Deep stock, same-day dispatch, and one accountable vendor from PO to delivery.';
    $sinceYear = data_get($settings, 'since_year') ?: '2013';
    $locations = data_get($settings, 'locations') ?: 'Nashik & Jalgaon';
@endphp

@section('content')
{{-- ============================ Hero (light) ============================ --}}
<section class="relative overflow-hidden bg-white">
    <div class="absolute inset-0" style="background: radial-gradient(ellipse at 82% 0%, rgba(10,10,10,.05), transparent 55%);"></div>

    <div class="relative mx-auto max-w-7xl px-6 pb-20 pt-14 lg:px-8 lg:pb-28 lg:pt-20">
        <div class="grid items-end gap-12 lg:grid-cols-[1.15fr_1fr]">
            <div>
                <span class="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">{{ $eyebrow }}</span>
                <h1 class="mt-6 text-5xl font-semibold leading-[1.02] tracking-tight text-neutral-950 sm:text-6xl lg:text-7xl">
                    {{ $headline }}
                </h1>
            </div>
            <div class="lg:pb-2">
                <p class="text-lg leading-relaxed text-neutral-600">{{ $subtext }}</p>
                <div class="mt-8 flex flex-wrap items-center gap-3">
                    <a href="{{ route('contact') }}" class="inline-flex h-12 items-center rounded-full bg-neutral-950 px-7 text-sm font-semibold text-white transition hover:bg-neutral-800">
                        Get a quote
                    </a>
                    <a href="{{ route('catalogues') }}" class="inline-flex h-12 items-center rounded-full border border-neutral-300 px-7 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100">
                        Browse catalogues
                    </a>
                </div>
                <p class="mt-8 text-sm text-neutral-400">Distributors since {{ $sinceYear }} · {{ $locations }}</p>
            </div>
        </div>
    </div>
</section>

{{-- The remaining homepage sections (brand strip, what we do, range, why GC,
     stats, process, who we serve, enquiry) are being rebuilt next, one at a time. --}}
@endsection
