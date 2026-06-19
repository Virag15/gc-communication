@props(['settings' => []])
@php
    $gtm = data_get($settings, 'gtm_id');
    $pixel = data_get($settings, 'meta_pixel_id');
@endphp
@if($gtm)
    {{-- Google Tag Manager (noscript) --}}
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{ $gtm }}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
@endif
@if($pixel)
    {{-- Meta Pixel (noscript) --}}
    <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id={{ $pixel }}&ev=PageView&noscript=1" alt=""/></noscript>
@endif
