@extends('errors.layout', [
    'status' => 500,
    'title' => 'Server Error',
    'description' => 'Something went wrong on our end. Our team has been notified. Please try again in a few moments.',
    'iconBg' => 'bg-red-500/10',
])

@section('icon')
    <svg class="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.97L13.75 4.05a2 2 0 00-3.5 0L3.32 16.03A2 2 0 005.07 19z"/>
    </svg>
@endsection

@section('action')
    <a href="{{ url('/') }}"
       class="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
        Home
    </a>
@endsection
