@extends('public.layout')

@section('content')
<section class="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
    <p class="text-xs font-semibold uppercase tracking-widest text-neutral-400">Insights</p>
    <h1 class="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Blog</h1>

    @if($posts->isEmpty())
        <p class="mt-10 text-neutral-500">No posts published yet.</p>
    @else
        <div class="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            @foreach($posts as $post)
                <a href="{{ route('blog.show', $post->slug) }}" class="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-neutral-900">
                    @if($post->cover_image)
                        <img src="{{ $post->cover_image }}" alt="{{ $post->title }}" class="aspect-[16/9] w-full object-cover">
                    @endif
                    <div class="p-5">
                        <p class="text-xs text-neutral-400">{{ optional($post->published_at)->format('d M Y') }}</p>
                        <h2 class="mt-1 font-semibold leading-snug group-hover:underline">{{ $post->title }}</h2>
                        @if($post->excerpt)
                            <p class="mt-2 line-clamp-3 text-sm text-neutral-500">{{ $post->excerpt }}</p>
                        @endif
                    </div>
                </a>
            @endforeach
        </div>
    @endif
</section>
@endsection
