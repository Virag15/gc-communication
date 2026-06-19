@extends('public.layout')

@php
    $siteName = data_get($settings, 'site_name') ?: config('admin.name', 'GC Communication');
    $logo = data_get($settings, 'org_logo') ?: '/images/gc-logo.svg';
    $heroImage = data_get($settings, 'hero_image');
    $eyebrow = data_get($settings, 'hero_eyebrow') ?: 'Authorised low-voltage switchgear distributor';
    $headline = data_get($settings, 'hero_headline') ?: 'The right switchgear on the shelf - and out the same day.';
    $subtext = data_get($settings, 'hero_subtext') ?: 'Six principal brands held deep across Nashik & Jalgaon. Deep stock, same-day dispatch, and one accountable vendor from PO to delivery.';
    $sinceYear = data_get($settings, 'since_year') ?: '2013';
    $locations = data_get($settings, 'locations') ?: 'Nashik & Jalgaon';
    $email = data_get($settings, 'contact_email');
    $phone = data_get($settings, 'contact_phone');
    $address = data_get($settings, 'contact_address');
    $year = date('Y');

    $stats = [
        ['value' => data_get($settings, 'stat_years') ?: '13', 'label' => 'Years in trade, since ' . $sinceYear],
        ['value' => data_get($settings, 'stat_lines') ?: '2,100+', 'label' => 'Lines held in stock'],
        ['value' => data_get($settings, 'stat_orders') ?: '25k+', 'label' => 'Orders dispatched to date'],
        ['value' => data_get($settings, 'stat_fill_rate') ?: '98%', 'label' => 'Order fill rate'],
    ];

    $range = [
        ['title' => 'Power distribution', 'items' => 'ACB · MCCB · Switch-disconnectors · Changeover & ATS · Fusegear · Lighting trunking'],
        ['title' => 'Power control', 'items' => 'MPCB · Contactors · Overload relays & starters · LV motors · Industrial plugs & sockets · Control & signalling'],
        ['title' => 'Protection, metering & control', 'items' => 'SPD · Meters & power-quality · Capacitors · Protection relays · Earth-leakage · Timers · Annunciators'],
        ['title' => 'Wiring & site accessories', 'items' => 'Modular switches · Weatherproof enclosures · Limit & toggle switches · Cable trays · Glands, lugs, wires & cables'],
        ['title' => 'Final distribution', 'items' => 'MCB · RCBO · RCCB · ACCL · Distribution boards · Plug & socket DB · Enclosures'],
    ];

    $whyGc = [
        ['t' => 'Stock depth', 'd' => 'Fast movers reordered weekly, so repeats ship from the shelf - not a backorder.'],
        ['t' => 'Same-day dispatch', 'd' => 'Same-day on stocked lines, in-city and outstation.'],
        ['t' => 'Single accountable vendor', 'd' => 'One contact owns the order from PO to proof of delivery.'],
        ['t' => 'Credit terms', 'd' => 'Trade credit for established accounts, agreed up front.'],
        ['t' => 'Technical support', 'd' => 'Help picking the right part for the rating when it is in question.'],
        ['t' => 'Local presence', 'd' => 'Two stocking points across North Maharashtra, close to your site.'],
    ];

    $steps = [
        ['t' => 'Order', 'd' => 'Call, email, or send the BOM.'],
        ['t' => 'Stock confirmed', 'd' => 'Availability confirmed in minutes.'],
        ['t' => 'Picked & packed', 'd' => 'Pulled, checked, packed.'],
        ['t' => 'Dispatched', 'd' => 'Same day, in-city & outstation.'],
        ['t' => 'On site', 'd' => 'Delivered to your plant.'],
    ];

    $serve = [
        ['t' => 'Panel builders', 'd' => 'Assemble LV panels and need components on the bench, not on backorder.'],
        ['t' => 'OEMs & machine builders', 'd' => 'Build to a fixed BOM and reorder the same lines repeatedly.'],
        ['t' => 'Electrical contractors', 'd' => 'Wiring sites to deadlines, where a missing part stops the job.'],
        ['t' => 'MEP consultants', 'd' => 'Specify ratings and brands for building and infrastructure projects.'],
        ['t' => 'Industrial plants', 'd' => 'Maintenance and breakdown spares that keep production running.'],
        ['t' => 'Infrastructure projects', 'd' => 'Substations, utilities and large infra builds needing switchgear at scale.'],
    ];
@endphp

@section('content')
{{-- ============================ Header ============================ --}}
<header class="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="/" class="flex items-center gap-2">
            <img src="{{ $logo }}" alt="{{ $siteName }}" class="h-9 w-auto">
            <span class="text-lg font-extrabold tracking-tight">{{ $siteName }}</span>
        </a>
        <nav class="hidden items-center gap-7 text-sm font-medium text-neutral-600 md:flex">
            <a href="#what" class="hover:text-neutral-900">What we do</a>
            <a href="#brands" class="hover:text-neutral-900">Brands</a>
            <a href="#range" class="hover:text-neutral-900">Range</a>
            <a href="{{ route('catalogues') }}" class="hover:text-neutral-900">Catalogues</a>
            <a href="#contact" class="hover:text-neutral-900">Contact</a>
        </nav>
        <a href="#contact" class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">Get a quote</a>
    </div>
</header>

<main>
    {{-- ============================ Hero ============================ --}}
    <section class="relative overflow-hidden border-b border-neutral-200 bg-neutral-950 text-white">
        @if($heroImage)
            <img src="{{ $heroImage }}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-40">
            <div class="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/30"></div>
        @else
            <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,theme(colors.emerald.900),transparent_60%)]"></div>
        @endif
        <div class="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
            <span class="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                {{ $eyebrow }}
            </span>
            <h1 class="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                {{ $headline }}
            </h1>
            <p class="mt-5 max-w-2xl text-lg text-neutral-300">{{ $subtext }}</p>
            <div class="mt-8 flex flex-wrap gap-3">
                <a href="#contact" class="rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-400">Contact sales</a>
                <a href="{{ route('catalogues') }}" class="rounded-md border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">Download catalogues</a>
            </div>
            <p class="mt-8 text-sm text-neutral-400">Distributors since {{ $sinceYear }} · {{ $locations }}</p>
        </div>
    </section>

    {{-- ============================ Brand strip ============================ --}}
    @if($brands->count())
    <section class="border-b border-neutral-200 py-10">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <p class="text-center text-xs font-semibold uppercase tracking-widest text-blue-600">Authorised distributor of</p>
            <div class="mt-6 grid grid-cols-2 items-center gap-4 sm:grid-cols-3 lg:grid-cols-6">
                @foreach($brands as $brand)
                    <div class="flex h-20 items-center justify-center rounded-xl border border-neutral-200 bg-white p-3">
                        @if($brand->logo)
                            <img src="{{ $brand->logo }}" alt="{{ $brand->name }}" class="max-h-full max-w-full object-contain" loading="lazy">
                        @else
                            <span class="text-sm font-semibold text-neutral-500">{{ $brand->name }}</span>
                        @endif
                    </div>
                @endforeach
            </div>
        </div>
    </section>
    @endif

    {{-- ============================ What we do ============================ --}}
    <section id="what" class="border-b border-neutral-200 py-20">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <p class="text-xs font-semibold uppercase tracking-widest text-blue-600">What we do</p>
            <h2 class="mt-2 max-w-3xl text-3xl font-bold tracking-tight">One window between you and the parts.</h2>
            <p class="mt-3 max-w-2xl text-neutral-600">Deep stock, same-day dispatch, technical help when a rating is in question, and trade credit for established accounts. No depot to chase, no scattered POs.</p>
            <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                @foreach([['Stock','Lines held in depth, ready to pick.'],['Order','One PO to one accountable vendor.'],['Dispatch','Same-day on stocked lines, in-city & outstation.'],['On the panel','Fitted and running, then reordered.']] as $i => $step)
                    <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
                        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">{{ $i + 1 }}</div>
                        <h3 class="mt-4 font-semibold">{{ $step[0] }}</h3>
                        <p class="mt-1 text-sm text-neutral-600">{{ $step[1] }}</p>
                    </div>
                @endforeach
            </div>
        </div>
    </section>

    {{-- ============================ Cost of bad sourcing ============================ --}}
    <section class="border-b border-neutral-200 bg-neutral-50 py-20">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 class="max-w-3xl text-3xl font-bold tracking-tight">A missing part stalls the panel. The panel stalls the site.</h2>
            <p class="mt-3 text-neutral-600">Time from order to having every part in hand.</p>
            <div class="mt-10 space-y-6">
                <div>
                    <div class="mb-2 flex items-center justify-between text-sm font-medium">
                        <span class="text-neutral-700">Chasing parts across many suppliers</span>
                        <span class="text-neutral-500">~12 days</span>
                    </div>
                    <div class="h-4 w-full rounded-full bg-neutral-200"><div class="h-4 w-full rounded-full bg-neutral-400"></div></div>
                </div>
                <div>
                    <div class="mb-2 flex items-center justify-between text-sm font-medium">
                        <span class="text-neutral-700">GC - in stock, one accountable vendor</span>
                        <span class="text-emerald-600">Same day</span>
                    </div>
                    <div class="h-4 w-full rounded-full bg-neutral-200"><div class="h-4 w-[8%] rounded-full bg-emerald-500"></div></div>
                </div>
            </div>
        </div>
    </section>

    {{-- ============================ Authorised distribution ============================ --}}
    <section id="brands" class="border-b border-neutral-200 py-20">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 class="text-3xl font-bold tracking-tight">Authorised distribution.</h2>
            <p class="mt-3 max-w-2xl text-neutral-600">Established brands, supplied as genuine, warranty-backed lines - not grey-market stock.</p>
            <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                @foreach($brands as $brand)
                    <div class="rounded-2xl border border-neutral-200 bg-white p-6">
                        <div class="flex h-12 items-center">
                            @if($brand->logo)
                                <img src="{{ $brand->logo }}" alt="{{ $brand->name }}" class="max-h-12 max-w-[140px] object-contain" loading="lazy">
                            @else
                                <span class="text-lg font-bold">{{ $brand->name }}</span>
                            @endif
                        </div>
                        <h3 class="mt-4 font-semibold">{{ $brand->name }}</h3>
                        <p class="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Authorised distributor</p>
                        <p class="mt-2 text-sm text-neutral-600">{{ $brand->description }}</p>
                    </div>
                @endforeach
            </div>
        </div>
    </section>

    {{-- ============================ The range ============================ --}}
    <section id="range" class="border-b border-neutral-200 bg-neutral-50 py-20">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <p class="text-xs font-semibold uppercase tracking-widest text-blue-600">The range</p>
            <h2 class="mt-2 text-3xl font-bold tracking-tight">What's on the shelf.</h2>
            <p class="mt-3 max-w-2xl text-neutral-600">From the incomer to the final circuit - the lines your panels and sites run on.</p>
            <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                @foreach($range as $fam)
                    <div class="rounded-2xl border border-neutral-200 bg-white p-6">
                        <div class="mb-4 h-1 w-10 rounded-full bg-emerald-500"></div>
                        <h3 class="font-semibold">{{ $fam['title'] }}</h3>
                        <p class="mt-2 text-sm text-neutral-600">{{ $fam['items'] }}</p>
                    </div>
                @endforeach
                <div class="flex flex-col justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-6">
                    <p class="text-sm text-neutral-600">Type-2 co-ordination charts and the full line card on request.</p>
                    <a href="#contact" class="mt-3 text-sm font-semibold text-blue-600 hover:underline">Request the line card →</a>
                </div>
            </div>
        </div>
    </section>

    {{-- ============================ Why GC ============================ --}}
    <section class="border-b border-neutral-200 py-20">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 class="text-3xl font-bold tracking-tight">Why GC.</h2>
            <p class="mt-3 max-w-2xl text-neutral-600">Six reasons procurement teams keep us on the approved-vendor list - all pointing to one thing: an order you can rely on.</p>
            <div class="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                @foreach($whyGc as $why)
                    <div>
                        <div class="mb-3 h-2 w-2 rounded-full bg-pink-500"></div>
                        <h3 class="font-semibold">{{ $why['t'] }}</h3>
                        <p class="mt-1 text-sm text-neutral-600">{{ $why['d'] }}</p>
                    </div>
                @endforeach
            </div>
        </div>
    </section>

    {{-- ============================ Momentum / stats ============================ --}}
    <section class="border-b border-neutral-200 bg-neutral-950 py-20 text-white">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 class="text-3xl font-bold tracking-tight">Thirteen years, and growing.</h2>
            <p class="mt-3 max-w-2xl text-neutral-300">A steady climb in volume and customers as the catalogue has widened across North Maharashtra.</p>
            <div class="mt-10 grid grid-cols-2 gap-8 lg:grid-cols-4">
                @foreach($stats as $i => $stat)
                    <div>
                        <p class="text-4xl font-extrabold tracking-tight {{ $i === 3 ? 'text-emerald-400' : '' }}">{{ $stat['value'] }}</p>
                        <p class="mt-1 text-sm text-neutral-400">{{ $stat['label'] }}</p>
                    </div>
                @endforeach
            </div>
        </div>
    </section>

    {{-- ============================ How we work ============================ --}}
    <section class="border-b border-neutral-200 py-20">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 class="text-3xl font-bold tracking-tight">Order to dispatch, same day.</h2>
            <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                @foreach($steps as $i => $step)
                    <div class="rounded-2xl border {{ $i === 3 ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-200 bg-white' }} p-5">
                        <p class="text-xs font-semibold {{ $i === 3 ? 'text-emerald-100' : 'text-neutral-400' }}">Step {{ $i + 1 }}</p>
                        <h3 class="mt-1 font-semibold">{{ $step['t'] }}</h3>
                        <p class="mt-1 text-sm {{ $i === 3 ? 'text-emerald-50' : 'text-neutral-600' }}">{{ $step['d'] }}</p>
                    </div>
                @endforeach
            </div>
            <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div><p class="text-2xl font-bold">4 PM</p><p class="text-sm text-neutral-500">Daily order cut-off</p></div>
                <div><p class="text-2xl font-bold text-emerald-600">Same day</p><p class="text-sm text-neutral-500">Dispatch, in-city & outstation</p></div>
                <div><p class="text-2xl font-bold">One</p><p class="text-sm text-neutral-500">Contact, PO to delivery</p></div>
            </div>
        </div>
    </section>

    {{-- ============================ Who we serve ============================ --}}
    <section class="border-b border-neutral-200 bg-neutral-50 py-20">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <p class="text-xs font-semibold uppercase tracking-widest text-blue-600">Who we serve</p>
            <h2 class="mt-2 text-3xl font-bold tracking-tight">Who buys from us.</h2>
            <div class="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                @foreach($serve as $i => $s)
                    <div>
                        <div class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500 text-sm font-bold text-neutral-900">{{ sprintf('%02d', $i + 1) }}</div>
                        <h3 class="mt-3 font-semibold">{{ $s['t'] }}</h3>
                        <p class="mt-1 text-sm text-neutral-600">{{ $s['d'] }}</p>
                    </div>
                @endforeach
            </div>
        </div>
    </section>

    {{-- ============================ Catalogues teaser ============================ --}}
    @if($catalogueCount > 0)
    <section class="border-b border-neutral-200 py-16">
        <div class="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6">
            <div>
                <h2 class="text-2xl font-bold tracking-tight">Brand catalogues & line cards</h2>
                <p class="mt-1 text-neutral-600">{{ $catalogueCount }} {{ \Illuminate\Support\Str::plural('document', $catalogueCount) }} available to download.</p>
            </div>
            <a href="{{ route('catalogues') }}" class="rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800">Browse catalogues</a>
        </div>
    </section>
    @endif

    {{-- ============================ Contact / bottom line ============================ --}}
    <section id="contact" class="bg-neutral-950 py-20 text-white">
        <div class="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
            <div>
                <p class="text-xs font-semibold uppercase tracking-widest text-emerald-400">The bottom line</p>
                <h2 class="mt-2 text-3xl font-bold tracking-tight">A stalled panel costs far more than the part that stalled it.</h2>
                <p class="mt-4 max-w-xl text-neutral-300">Kept on the shelf and dispatched the day you order, from one vendor accountable end to end. Send us your enquiry or BOM and we'll get back to you quickly.</p>
                @if($email)
                    <a href="mailto:{{ $email }}" class="mt-8 inline-block rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-400">Email us</a>
                @endif
            </div>
            <div class="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm">
                @if($phone)<p><span class="text-neutral-400">Phone</span><br><a class="font-medium hover:underline" href="tel:{{ $phone }}">{{ $phone }}</a></p>@endif
                @if($email)<p><span class="text-neutral-400">Email</span><br><a class="font-medium hover:underline" href="mailto:{{ $email }}">{{ $email }}</a></p>@endif
                @if($address)<p><span class="text-neutral-400">Address</span><br><span class="font-medium">{{ $address }}</span></p>@endif
                @unless($phone || $email || $address)<p class="text-neutral-400">Add your contact details in the admin → Site Settings.</p>@endunless
            </div>
        </div>
    </section>
</main>

{{-- ============================ Footer ============================ --}}
<footer class="border-t border-neutral-200 py-10">
    <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div class="flex items-center gap-2">
            <img src="{{ $logo }}" alt="{{ $siteName }}" class="h-7 w-auto">
            <span class="text-sm font-semibold">{{ $siteName }}</span>
        </div>
        <div class="flex items-center gap-5 text-sm text-neutral-500">
            @if($fb = data_get($settings, 'social_facebook'))<a href="{{ $fb }}" class="hover:text-neutral-900" rel="noopener" target="_blank">Facebook</a>@endif
            @if($ig = data_get($settings, 'social_instagram'))<a href="{{ $ig }}" class="hover:text-neutral-900" rel="noopener" target="_blank">Instagram</a>@endif
            @if($li = data_get($settings, 'social_linkedin'))<a href="{{ $li }}" class="hover:text-neutral-900" rel="noopener" target="_blank">LinkedIn</a>@endif
        </div>
        <p class="text-xs text-neutral-400">&copy; {{ $year }} {{ $siteName }}. All rights reserved.</p>
    </div>
</footer>
@endsection
