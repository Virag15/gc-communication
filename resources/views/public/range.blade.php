@extends('public.layout')

@php
    $range = [
        ['title' => 'Power distribution', 'items' => 'ACB · MCCB · Switch-disconnectors · Changeover & ATS · Fusegear · Lighting trunking'],
        ['title' => 'Power control', 'items' => 'MPCB · Contactors · Overload relays & starters · LV motors · Industrial plugs & sockets · Control & signalling'],
        ['title' => 'Protection, metering & control', 'items' => 'SPD · Meters & power-quality · Capacitors · Protection relays · Earth-leakage · Timers · Annunciators'],
        ['title' => 'Wiring & site accessories', 'items' => 'Modular switches · Weatherproof enclosures · Limit & toggle switches · Cable trays · Glands, lugs, wires & cables'],
        ['title' => 'Final distribution', 'items' => 'MCB · RCBO · RCCB · ACCL · Distribution boards · Plug & socket DB · Enclosures'],
    ];
@endphp

@section('content')
<section class="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
    <p class="text-xs font-semibold uppercase tracking-widest text-neutral-400">The range</p>
    <h1 class="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">What's on the shelf.</h1>
    <p class="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-500">
        From the incomer to the final circuit — the lines your panels and sites run on, held across two stocking points.
    </p>

    <div class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        @foreach ($range as $fam)
            <div class="rounded-2xl border border-neutral-200 bg-white p-7 transition hover:border-neutral-900">
                <div class="mb-5 h-px w-10 bg-neutral-900"></div>
                <h2 class="text-lg font-semibold tracking-tight">{{ $fam['title'] }}</h2>
                <p class="mt-3 text-sm leading-relaxed text-neutral-500">{{ $fam['items'] }}</p>
            </div>
        @endforeach
        <div class="flex flex-col justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-7">
            <p class="text-sm leading-relaxed text-neutral-500">Type-2 co-ordination charts and the full line card on request.</p>
            <a href="{{ route('contact') }}" class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 hover:underline">Request the line card →</a>
        </div>
    </div>
</section>
@endsection
