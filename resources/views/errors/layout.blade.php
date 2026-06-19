<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $status }} - {{ $title }}</title>
    <meta name="robots" content="noindex, nofollow">
    <link rel="icon" type="image/png" href="{{ asset('favicon.png') }}">
    @vite(['resources/css/admin.css'])
</head>
<body class="antialiased bg-background text-foreground font-sans">
    <div class="flex min-h-screen items-center justify-center p-4">
        <div class="w-full max-w-md rounded-xl border border-border/50 bg-card shadow-lg">
            <div class="flex flex-col items-center text-center p-8 space-y-6">
                {{-- Icon --}}
                <div class="flex h-16 w-16 items-center justify-center rounded-full {{ $iconBg }}">
                    @yield('icon')
                </div>

                {{-- Status + Title + Description --}}
                <div class="space-y-2">
                    <p class="text-5xl font-bold tabular-nums tracking-tight text-foreground">
                        {{ $status }}
                    </p>
                    <h1 class="text-lg font-semibold text-foreground">
                        {{ $title }}
                    </h1>
                    <p class="text-sm leading-relaxed text-muted-foreground">
                        {{ $description }}
                    </p>
                </div>

                {{-- Extra content (timer for 429) --}}
                @yield('extra')

                {{-- Buttons --}}
                <div class="flex flex-col gap-2 w-full sm:flex-row sm:justify-center">
                    <a href="javascript:history.back()"
                       class="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                        </svg>
                        Go Back
                    </a>
                    @yield('action')
                </div>
            </div>
        </div>
    </div>
</body>
</html>
