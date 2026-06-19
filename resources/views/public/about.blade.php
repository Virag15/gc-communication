@extends('public.layout')

@php
    $sinceYear = data_get($settings, 'since_year') ?: '2013';
    $locations = data_get($settings, 'locations') ?: 'Nashik & Jalgaon';
    $stats = [
        ['value' => data_get($settings, 'stat_years') ?: '13', 'label' => 'Years in trade, since ' . $sinceYear],
        ['value' => data_get($settings, 'stat_lines') ?: '2,100+', 'label' => 'Lines held in stock'],
        ['value' => data_get($settings, 'stat_orders') ?: '25k+', 'label' => 'Orders dispatched to date'],
        ['value' => data_get($settings, 'stat_fill_rate') ?: '98%', 'label' => 'Order fill rate'],
    ];
@endphp

@section('content')
<section class="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
    <p class="text-xs font-semibold uppercase tracking-widest text-neutral-400">About GC Communication</p>
    <h1 class="mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        One window between you and the parts that keep panels and sites running.
    </h1>
    <p class="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-500">
        An authorised low-voltage switchgear distributor holding six principal brands deep across {{ $locations }} — built for procurement teams who can't afford a stalled panel waiting on a backorder.
    </p>

    <div class="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 lg:grid-cols-4">
        @foreach ($stats as $stat)
            <div class="bg-white p-8">
                <p class="text-3xl font-semibold tracking-tight sm:text-4xl">{{ $stat['value'] }}</p>
                <p class="mt-2 text-sm text-neutral-500">{{ $stat['label'] }}</p>
            </div>
        @endforeach
    </div>
</section>
@endsection
