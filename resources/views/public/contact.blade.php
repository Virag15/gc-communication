@extends('public.layout')

@php
    $email = data_get($settings, 'contact_email');
    $phone = data_get($settings, 'contact_phone');
    $address = data_get($settings, 'contact_address');
    $inputCls = 'w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900';
@endphp

@section('content')
<section class="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
    <div class="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
            <p class="text-xs font-semibold uppercase tracking-widest text-neutral-400">Contact</p>
            <h1 class="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Send us your enquiry or BOM.</h1>
            <p class="mt-5 max-w-md text-lg leading-relaxed text-neutral-500">
                Tell us what you need and we'll confirm stock and pricing quickly — one accountable vendor from PO to delivery.
            </p>

            <dl class="mt-10 space-y-4 text-sm">
                @if ($phone)
                    <div class="flex gap-3">
                        <dt class="w-20 shrink-0 font-semibold text-neutral-400">Phone</dt>
                        <dd><a class="text-neutral-900 hover:underline" href="tel:{{ $phone }}">{{ $phone }}</a></dd>
                    </div>
                @endif
                @if ($email)
                    <div class="flex gap-3">
                        <dt class="w-20 shrink-0 font-semibold text-neutral-400">Email</dt>
                        <dd><a class="text-neutral-900 hover:underline" href="mailto:{{ $email }}">{{ $email }}</a></dd>
                    </div>
                @endif
                @if ($address)
                    <div class="flex gap-3">
                        <dt class="w-20 shrink-0 font-semibold text-neutral-400">Address</dt>
                        <dd class="max-w-xs leading-relaxed text-neutral-600">{{ $address }}</dd>
                    </div>
                @endif
            </dl>
        </div>

        <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-7 sm:p-8">
            @if (session('success'))
                <div class="mb-5 rounded-lg border border-neutral-900 bg-neutral-900 p-3.5 text-sm text-white">
                    {{ session('success') }}
                </div>
            @endif
            <form method="POST" action="{{ route('enquiry.store') }}" class="space-y-3.5">
                @csrf
                <div class="grid gap-3.5 sm:grid-cols-2">
                    <div>
                        <input name="name" required value="{{ old('name') }}" placeholder="Name" class="{{ $inputCls }}">
                        @error('name')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                    </div>
                    <div>
                        <input name="email" type="email" required value="{{ old('email') }}" placeholder="Email" class="{{ $inputCls }}">
                        @error('email')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                    </div>
                    <input name="phone" value="{{ old('phone') }}" placeholder="Phone (optional)" class="{{ $inputCls }}">
                    <input name="company" value="{{ old('company') }}" placeholder="Company (optional)" class="{{ $inputCls }}">
                </div>
                <div>
                    <textarea name="message" required rows="4" placeholder="Your requirement or BOM" class="{{ $inputCls }}">{{ old('message') }}</textarea>
                    @error('message')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>
                <button type="submit" class="inline-flex h-12 w-full items-center justify-center rounded-full bg-neutral-950 px-7 text-sm font-semibold text-white transition hover:bg-neutral-800">
                    Send enquiry
                </button>
            </form>
        </div>
    </div>
</section>
@endsection
