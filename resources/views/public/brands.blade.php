@extends('public.layout')

@section('content')
<section class="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
    <p class="text-xs font-semibold uppercase tracking-widest text-neutral-400">Authorised distribution</p>
    <h1 class="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">The brands we hold.</h1>
    <p class="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-500">
        Genuine, warranty-backed lines from established manufacturers — held deep and supplied as authorised stock, not grey-market goods.
    </p>

    @if ($brands->count())
        <div class="mt-14 grid gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
            @foreach ($brands as $brand)
                <div class="group flex flex-col bg-white p-8">
                    <div class="flex h-12 items-center">
                        @if ($brand->logo)
                            <img src="{{ $brand->logo }}" alt="{{ $brand->name }}"
                                 class="max-h-10 max-w-[150px] object-contain grayscale transition duration-300 group-hover:grayscale-0" loading="lazy">
                        @else
                            <span class="text-lg font-semibold">{{ $brand->name }}</span>
                        @endif
                    </div>
                    <h2 class="mt-6 text-lg font-semibold tracking-tight">{{ $brand->name }}</h2>
                    <p class="mt-2 text-sm leading-relaxed text-neutral-500">{{ $brand->description }}</p>
                    @if ($brand->website)
                        <a href="{{ $brand->website }}" rel="noopener" target="_blank"
                           class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 hover:underline">
                            Visit site →
                        </a>
                    @endif
                </div>
            @endforeach
        </div>
    @else
        <div class="mt-14 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center text-neutral-500">
            Brand line-up coming soon.
        </div>
    @endif

    <div class="mt-16 flex flex-col items-start gap-4 rounded-2xl bg-neutral-950 p-10 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h2 class="text-2xl font-semibold tracking-tight">Need a specific brand or rating?</h2>
            <p class="mt-2 text-white/60">Send your requirement and we'll confirm stock and pricing.</p>
        </div>
        <a href="{{ route('contact') }}" class="inline-flex h-12 shrink-0 items-center rounded-full bg-white px-7 text-sm font-semibold text-neutral-950 transition hover:bg-white/90">Get a quote</a>
    </div>
</section>
@endsection
