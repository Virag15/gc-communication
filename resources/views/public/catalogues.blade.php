@extends('public.layout')

@php
    $siteName = data_get($settings, 'site_name') ?: config('admin.name', 'GC Communication');
    $logo = data_get($settings, 'org_logo') ?: '/images/gc-logo.svg';
    $email = data_get($settings, 'contact_email');
    $year = date('Y');
    $grouped = $catalogues->groupBy(fn ($c) => $c->brand?->name ?? 'General');
    $fmtSize = function ($bytes) {
        if (!$bytes) return null;
        $mb = $bytes / 1048576;
        return $mb >= 1 ? round($mb, 1) . ' MB' : max(1, round($bytes / 1024)) . ' KB';
    };
@endphp

@section('content')
<header class="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="/" class="flex items-center gap-2">
            <img src="{{ $logo }}" alt="{{ $siteName }}" class="h-9 w-auto">
            <span class="text-lg font-extrabold tracking-tight">{{ $siteName }}</span>
        </a>
        <a href="/" class="text-sm font-medium text-neutral-600 hover:text-neutral-900">← Back to home</a>
    </div>
</header>

<main class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <p class="text-xs font-semibold uppercase tracking-widest text-blue-600">Downloads</p>
    <h1 class="mt-2 text-4xl font-extrabold tracking-tight">Catalogues & line cards</h1>
    <p class="mt-3 max-w-2xl text-neutral-600">Product catalogues from the brands we hold. Need a specific line card or co-ordination chart? <a href="/#contact" class="font-semibold text-blue-600 hover:underline">Ask us</a>.</p>

    @if($catalogues->isEmpty())
        <div class="mt-12 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
            <p class="text-neutral-600">No catalogues published yet.</p>
            @if($email)<a href="mailto:{{ $email }}" class="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline">Request a catalogue by email →</a>@endif
        </div>
    @else
        <div class="mt-12 space-y-12">
            @foreach($grouped as $brandName => $items)
                <div>
                    <h2 class="mb-4 text-lg font-bold tracking-tight">{{ $brandName }}</h2>
                    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        @foreach($items as $cat)
                            <a href="{{ $cat->file }}" target="_blank" rel="noopener"
                               class="group flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-900 hover:shadow-sm">
                                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-xs font-bold text-pink-600">PDF</div>
                                <div class="min-w-0">
                                    <p class="font-semibold leading-snug group-hover:text-neutral-900">{{ $cat->title }}</p>
                                    <p class="mt-1 text-xs text-neutral-500">
                                        Download{{ $fmtSize($cat->file_size) ? ' · ' . $fmtSize($cat->file_size) : '' }}
                                    </p>
                                </div>
                            </a>
                        @endforeach
                    </div>
                </div>
            @endforeach
        </div>
    @endif
</main>

<footer class="border-t border-neutral-200 py-10">
    <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div class="flex items-center gap-2">
            <img src="{{ $logo }}" alt="{{ $siteName }}" class="h-7 w-auto">
            <span class="text-sm font-semibold">{{ $siteName }}</span>
        </div>
        <p class="text-xs text-neutral-400">&copy; {{ $year }} {{ $siteName }}. All rights reserved.</p>
    </div>
</footer>
@endsection
