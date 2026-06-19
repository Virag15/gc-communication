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
<section class="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
    <p class="text-xs font-semibold uppercase tracking-widest text-neutral-400">Downloads</p>
    <h1 class="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Catalogues & line cards</h1>
    <p class="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-500">Product catalogues from the brands we hold. Need a specific line card or co-ordination chart? <a href="{{ route('contact') }}" class="font-semibold text-neutral-900 hover:underline">Ask us</a>.</p>

    @if($catalogues->isEmpty())
        <div class="mt-14 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
            <p class="text-neutral-500">No catalogues published yet.</p>
            @if($email)<a href="mailto:{{ $email }}" class="mt-3 inline-block text-sm font-semibold text-neutral-900 hover:underline">Request a catalogue by email →</a>@endif
        </div>
    @else
        <div class="mt-14 space-y-12">
            @foreach($grouped as $brandName => $items)
                <div>
                    <h2 class="mb-4 text-sm font-semibold uppercase tracking-widest text-neutral-400">{{ $brandName }}</h2>
                    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        @foreach($items as $cat)
                            <button type="button"
                               data-pdf="{{ $cat->file }}"
                               data-title="{{ $cat->title }}"
                               data-download="{{ route('catalogues.download', $cat->id) }}"
                               class="pdf-card group flex w-full items-start gap-3.5 rounded-2xl border border-neutral-200 bg-white p-5 text-left transition hover:border-neutral-900">
                                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[11px] font-bold tracking-wide text-neutral-500">PDF</div>
                                <div class="min-w-0">
                                    <p class="font-semibold leading-snug">{{ $cat->title }}</p>
                                    <p class="mt-1 text-xs text-neutral-500">
                                        View &middot; Download{{ $fmtSize($cat->file_size) ? ' · ' . $fmtSize($cat->file_size) : '' }}
                                    </p>
                                </div>
                            </button>
                        @endforeach
                    </div>
                </div>
            @endforeach
        </div>
    @endif
</section>

{{-- PDF viewer modal: native in-browser rendering (view) + counted download --}}
<div id="pdfModal" class="fixed inset-0 z-[60] hidden items-center justify-center bg-black/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="pdfModalTitle">
    <div class="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div class="flex items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2.5 sm:px-4">
            <p id="pdfModalTitle" class="min-w-0 truncate text-sm font-semibold sm:text-base"></p>
            <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <a id="pdfModalDownload" href="#" class="rounded-lg bg-neutral-950 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-neutral-800">Download</a>
                <a id="pdfModalOpen" href="#" target="_blank" rel="noopener" class="hidden rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 sm:inline-block">Open in tab</a>
                <button type="button" id="pdfModalClose" class="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100" aria-label="Close viewer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>
        </div>
        <iframe id="pdfModalFrame" class="h-full w-full flex-1 bg-neutral-100" title="PDF preview"></iframe>
    </div>
</div>

<script>
(function () {
    var modal = document.getElementById('pdfModal');
    if (!modal) return;
    var frame = document.getElementById('pdfModalFrame');
    var title = document.getElementById('pdfModalTitle');
    var dl = document.getElementById('pdfModalDownload');
    var open = document.getElementById('pdfModalOpen');

    function show(pdf, t, download) {
        title.textContent = t;
        dl.setAttribute('href', download);
        open.setAttribute('href', pdf);
        frame.setAttribute('src', pdf + '#view=FitH');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
    function hide() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        frame.setAttribute('src', 'about:blank');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.pdf-card').forEach(function (c) {
        c.addEventListener('click', function () {
            show(c.dataset.pdf, c.dataset.title, c.dataset.download);
        });
    });
    document.getElementById('pdfModalClose').addEventListener('click', hide);
    modal.addEventListener('click', function (e) { if (e.target === modal) hide(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
})();
</script>
@endsection
