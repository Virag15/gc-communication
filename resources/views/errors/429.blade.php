@extends('errors.layout', [
    'status' => 429,
    'title' => 'Too Many Requests',
    'description' => 'You\'ve made too many requests in a short period. Please wait for the timer to finish before retrying.',
    'iconBg' => 'bg-red-500/10',
])

@section('icon')
    <svg class="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
    </svg>
@endsection

@section('extra')
    <div class="w-full space-y-3">
        <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground" id="timer-label">Retry available in</span>
            <span class="font-mono font-semibold tabular-nums text-red-500" id="timer-display">1:00</span>
        </div>
        <div class="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div id="timer-bar" class="h-full rounded-full bg-primary transition-all duration-1000 ease-linear" style="width: 0%"></div>
        </div>
    </div>

    <script>
        (function() {
            var total = 60;
            var remaining = total;
            var label = document.getElementById('timer-label');
            var display = document.getElementById('timer-display');
            var bar = document.getElementById('timer-bar');
            var retryBtn = document.getElementById('retry-btn');

            function format(s) {
                var m = Math.floor(s / 60);
                var sec = s % 60;
                return m > 0 ? m + ':' + (sec < 10 ? '0' : '') + sec : sec + 's';
            }

            function tick() {
                remaining--;
                var pct = ((total - remaining) / total) * 100;
                bar.style.width = pct + '%';
                display.textContent = remaining > 0 ? format(remaining) : 'Ready';

                if (remaining <= 0) {
                    label.textContent = 'You can retry now';
                    display.classList.remove('text-red-500');
                    display.classList.add('text-emerald-600');
                    if (retryBtn) {
                        retryBtn.classList.remove('opacity-50', 'pointer-events-none');
                        retryBtn.querySelector('span').textContent = 'Retry';
                    }
                    return;
                }
                setTimeout(tick, 1000);
            }

            setTimeout(tick, 1000);
        })();
    </script>
@endsection

@section('action')
    <a id="retry-btn" href="javascript:location.reload()"
       class="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted opacity-50 pointer-events-none">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <span>Please wait…</span>
    </a>
@endsection
