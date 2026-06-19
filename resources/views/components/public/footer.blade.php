@php
    $settings = \App\Models\SiteSetting::map();
    $siteName = data_get($settings, 'site_name') ?: config('admin.name', 'GC Communication');
    $email = data_get($settings, 'contact_email');
    $phone = data_get($settings, 'contact_phone');
    $address = data_get($settings, 'contact_address');
    $fb = data_get($settings, 'social_facebook');
    $ig = data_get($settings, 'social_instagram');
    $li = data_get($settings, 'social_linkedin');
    $year = date('Y');

    $explore = [
        ['label' => 'Brands', 'route' => 'brands'],
        ['label' => 'Range', 'route' => 'range'],
        ['label' => 'Catalogues', 'route' => 'catalogues'],
        ['label' => 'About', 'route' => 'about'],
        ['label' => 'Contact', 'route' => 'contact'],
    ];
@endphp

<footer class="border-t border-neutral-200 bg-white">
    <div class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div class="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
            <div>
                <a href="{{ route('home') }}" class="flex items-center gap-2.5">
                    <img src="/images/gc-logo.svg" alt="" aria-hidden="true" class="h-7 w-auto">
                    <span class="text-[15px] font-semibold tracking-tight text-neutral-900">{{ $siteName }}</span>
                </a>
                <p class="mt-4 max-w-xs text-sm leading-relaxed text-neutral-500">
                    Authorised low-voltage switchgear distribution — deep stock, same-day dispatch, one accountable vendor.
                </p>
            </div>

            <div>
                <p class="text-xs font-semibold uppercase tracking-widest text-neutral-400">Explore</p>
                <ul class="mt-4 space-y-2.5 text-sm text-neutral-600">
                    @foreach ($explore as $item)
                        <li><a class="transition hover:text-neutral-900" href="{{ route($item['route']) }}">{{ $item['label'] }}</a></li>
                    @endforeach
                </ul>
            </div>

            <div>
                <p class="text-xs font-semibold uppercase tracking-widest text-neutral-400">Contact</p>
                <ul class="mt-4 space-y-2.5 text-sm text-neutral-600">
                    @if ($phone)<li><a class="transition hover:text-neutral-900" href="tel:{{ $phone }}">{{ $phone }}</a></li>@endif
                    @if ($email)<li><a class="transition hover:text-neutral-900" href="mailto:{{ $email }}">{{ $email }}</a></li>@endif
                    @if ($address)<li class="max-w-xs leading-relaxed">{{ $address }}</li>@endif
                </ul>
            </div>
        </div>

        <div class="mt-12 flex flex-col items-start justify-between gap-4 border-t border-neutral-200 pt-8 sm:flex-row sm:items-center">
            <p class="text-xs text-neutral-400">&copy; {{ $year }} {{ $siteName }}. All rights reserved.</p>
            <div class="flex gap-5 text-sm text-neutral-500">
                @if ($fb)<a class="transition hover:text-neutral-900" href="{{ $fb }}" rel="noopener" target="_blank">Facebook</a>@endif
                @if ($ig)<a class="transition hover:text-neutral-900" href="{{ $ig }}" rel="noopener" target="_blank">Instagram</a>@endif
                @if ($li)<a class="transition hover:text-neutral-900" href="{{ $li }}" rel="noopener" target="_blank">LinkedIn</a>@endif
            </div>
        </div>
    </div>
</footer>
