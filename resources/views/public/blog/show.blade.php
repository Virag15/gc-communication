@extends('public.layout')

@section('content')
<article class="mx-auto max-w-3xl px-6 py-20 lg:py-28">
    <a href="{{ route('blog') }}" class="text-sm font-medium text-neutral-500 hover:text-neutral-900">&larr; Blog</a>
    <p class="mt-8 text-xs uppercase tracking-widest text-neutral-400">
        {{ optional($post->published_at)->format('d M Y') }}{{ $post->author ? ' · ' . $post->author : '' }}
    </p>
    <h1 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{{ $post->title }}</h1>
    @if($post->excerpt)
        <p class="mt-4 text-lg leading-relaxed text-neutral-500">{{ $post->excerpt }}</p>
    @endif
    @if($post->cover_image)
        <img src="{{ $post->cover_image }}" alt="{{ $post->title }}" class="mt-8 aspect-[16/9] w-full rounded-2xl object-cover">
    @endif
    <div class="prose prose-neutral mt-8 max-w-none">{!! $post->body !!}</div>
</article>
@endsection
