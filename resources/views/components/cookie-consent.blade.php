@props(['settings' => []])
@php $consent = filter_var(data_get($settings, 'consent_enabled'), FILTER_VALIDATE_BOOLEAN); @endphp
@if($consent)
<div id="gc-consent" class="fixed inset-x-0 bottom-0 z-50 hidden border-t border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur">
    <div class="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p class="text-sm text-neutral-600">
            We use cookies to analyse traffic and improve your experience.
        </p>
        <div class="flex shrink-0 gap-2">
            <button type="button" id="gc-consent-decline" class="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">Decline</button>
            <button type="button" id="gc-consent-accept" class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Accept</button>
        </div>
    </div>
</div>
<script>
(function () {
    var KEY = 'gc-cookie-consent';
    var el = document.getElementById('gc-consent');
    if (!el) return;
    function gtag() { window.dataLayer = window.dataLayer || []; window.dataLayer.push(arguments); }
    function update(state) {
        gtag('consent', 'update', {
            ad_storage: state, ad_user_data: state, ad_personalization: state, analytics_storage: state
        });
    }
    function choose(state) { try { localStorage.setItem(KEY, state); } catch (e) {} update(state); el.classList.add('hidden'); }
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (!saved) { el.classList.remove('hidden'); }
    else if (saved === 'granted') { update('granted'); }
    var accept = document.getElementById('gc-consent-accept');
    var decline = document.getElementById('gc-consent-decline');
    if (accept) accept.addEventListener('click', function () { choose('granted'); });
    if (decline) decline.addEventListener('click', function () { choose('denied'); });
})();
</script>
@endif
