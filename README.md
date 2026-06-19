# GC Communication - Admin Panel

The internal admin panel for **GC Communication**, built with **Laravel 13**,
**Inertia.js**, **React 19 + TypeScript**, **Tailwind CSS 4**, and **shadcn/ui**.

> Adapted from the Aurora-Logic admin template, fully converted to TypeScript and
> rebranded for GC Communication. Ships ready to deploy with a single command.

---

## Tech stack

| Layer       | Technology                                   |
| ----------- | -------------------------------------------- |
| Backend     | Laravel 13, PHP 8.4                          |
| Frontend    | React 19 + **TypeScript**, Inertia.js 3      |
| Styling     | Tailwind CSS 4, shadcn/ui (Radix Nova)       |
| Build       | Vite 8                                        |
| Charts      | Recharts · **Rich text** Tiptap · **Tables** TanStack |
| Deployment  | Docker (nginx + php-fpm + queue) & MySQL      |

## What's inside

- **Admin layout** - collapsible sidebar, mobile-responsive, breadcrumbs
- **Authentication** - login, logout, session auth with rate limiting
- **Role-based access** - `super_admin`, `admin`, `editor` with middleware guards
- **User management** - full CRUD with search, server-side pagination, roles
- **SEO management** - per-page meta, OG image, structured data, sitemap
- **Dashboard** - stat cards, registration trend chart, recent-activity feed
- **Audit trail** - automatic create/update/delete logging
- **Error pages** - 403/404/419/429/500/503 (Inertia + Blade)
- **Security** - security headers, OWASP test suite, CSRF, XSS sanitisation
- **Fully typed** - strict TypeScript across every component, page, and hook

---

## Quick start (local development)

Requirements: PHP 8.3+, Composer, Node 20+, npm.

```bash
make install   # composer + npm install, create .env, key, migrate & seed
make dev       # Laravel + queue + Vite dev server (hot reload)
```

Or manually:

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
composer dev
```

Then open **http://localhost:8000/admin/login**.

**Default credentials** (change immediately - configurable via `SEED_ADMIN_*`):

| Role        | Email                       | Password   |
| ----------- | --------------------------- | ---------- |
| Super admin | `admin@gc-communication.in`  | `password` |
| Editor      | `editor@gc-communication.in` | `password` |

---

## Deployment (your server, with Docker)

The whole stack - app, web server, queue worker, and MySQL - runs from a single
`docker compose`. On the server (Docker + Docker Compose installed):

```bash
# 1. Get the code onto the server, then:
make setup      # creates .env from .env.docker.example and generates APP_KEY

# 2. Edit .env - set strong DB_PASSWORD / DB_ROOT_PASSWORD (and APP_URL).

# 3. Build and start everything:
make up         # docker compose up -d --build
```

The app is now served on **http://your-server:8080** (change `APP_PORT` in `.env`).
On first boot, migrations run automatically and - because `APP_SEED=true` in the
Docker template - the initial admin user is created. Set `APP_SEED=false` afterwards.

Put a TLS-terminating reverse proxy (nginx, Caddy, Traefik) or your platform's load
balancer in front of port 8080 for HTTPS.

### Handy commands

```bash
make logs       # tail application logs
make shell      # shell inside the app container
make migrate    # run migrations
make seed       # seed the database
make fresh      # rebuild the database (DESTRUCTIVE)
make down       # stop the stack
make rebuild    # rebuild image from scratch
```

The image is a multi-stage build (`Dockerfile`): Vite compiles & type-checks the
front-end, Composer installs PHP deps, and the runtime stage serves the app via
nginx + php-fpm with a queue worker, all supervised in one container.

---

## Project structure

```
app/
├── Http/Controllers/         # PublicController (public site)
│   └── Admin/                # Dashboard, User, SEO, SiteSetting, Auth
├── Http/Middleware/          # AdminAccess, AdminOnly, SecurityHeaders, Inertia
├── Http/Requests/Admin/      # Form-request validation
├── Models/                   # User, SeoSetting, SiteSetting, AuditLog
└── Traits/                   # Auditable (automatic audit logging)
config/admin.php              # Brand name, logo, timezone
database/                     # migrations, factories, seeders
docker/                       # nginx.conf, php-fpm.conf, supervisord.conf, entrypoint.sh
resources/
├── css/                      # app.css (brand tokens) · admin.css (shadcn theme)
├── js/
│   ├── admin.tsx             # Inertia entry point
│   ├── components/
│   │   ├── admin/            # AdminLayout
│   │   └── ui/               # shadcn/ui components (all .tsx)
│   ├── hooks/                # useDebounce, useAutosave, use-mobile
│   ├── lib/                  # dates.ts, utils.ts
│   ├── types/                # index.ts (domain types) + Inertia/global augmentations
│   └── Pages/                # Admin/* (incl. Settings), Auth/Login, Error
└── views/
    ├── app.blade.php         # Inertia root (admin)
    ├── public/               # server-rendered public site (layout + home)
    └── components/           # <x-seo-head> <x-tracking-head> <x-cookie-consent>
routes/                       # admin.php (admin) · web.php (public)
tests/Feature/Admin/          # Auth, User, SEO, OWASP security tests
Dockerfile · docker-compose.yml · Makefile
tsconfig.json                 # strict TypeScript configuration
```

---

## TypeScript

- Strict mode is enabled (`tsconfig.json`).
- Shared/domain types live in [`resources/js/types/index.ts`](resources/js/types/index.ts).
- Inertia shared props (`auth`, `admin`, `flash`) are globally typed via
  [`resources/js/types/inertia.d.ts`](resources/js/types/inertia.d.ts) - so
  `usePage().props` is fully typed everywhere.
- Type-check without building: `npm run type-check`.
- `npm run build` runs `tsc --noEmit` before bundling, so type errors fail the build.

## Branding

- **Name** - `ADMIN_NAME` in `.env` (default `GC Communication`).
- **Logo** - `ADMIN_LOGO` points at `/images/gc-logo.svg` (vector); replace the file to swap it.
- **Colours** - brand tokens in `resources/css/app.css`; shadcn theme (oklch) in
  `resources/css/admin.css`.
- **Favicon** - `public/favicon.svg` (the GC monogram).
- **Partner brands** - logos in `public/images/brands/` are shown on the login screen.

## Public website, SEO & analytics

The public, SEO-optimised site is **server-rendered with Blade** (best for search
engines) and lives in `resources/views/public/`. It is served from `/`; the admin
panel (`/admin`) stays private and `noindex`.

**Everything is dynamic**, managed in **Admin → Site Settings** (stored in the
`site_settings` table, cached). Every public page automatically includes:

- `<x-tracking-head>` - **Google Tag Manager, GA4, Meta Pixel**, and **Google Consent Mode**
- `<x-seo-head>` - title/description, canonical, robots, **Open Graph + Twitter** cards,
  **Google/Bing verification**, and **JSON-LD** Organization data
- `<x-cookie-consent>` - optional GDPR cookie banner wired to Consent Mode

Per-page SEO (title, description, OG image, structured data, noindex) comes from
**Admin → SEO**; the XML sitemap is generated there. `robots.txt` allows the site
and disallows `/admin`.

### Add a public page

```blade
{{-- resources/views/public/about.blade.php --}}
@extends('public.layout')
@section('content') ... @endsection
```
```php
// routes/web.php - pass settings + (optional) per-page SEO
Route::get('/about', fn () => view('public.about', [
    'settings' => \App\Models\SiteSetting::map(),
    'seo' => \App\Models\SeoSetting::where('page_identifier', 'about')->first(),
]));
```
Add `about` to `SeoController::ALLOWED_PAGES` to manage its SEO. Tags + SEO inject automatically.

> Tip: route GA4, Meta Pixel, Google Ads, etc. **through GTM** - then you only set the
> GTM ID here and manage the rest in the GTM dashboard with no code changes.

## Managing the public site (no code changes)

Everything on the public site is editable from the admin:

- **Brands** (`/admin/brands`) - logo upload, description, display order, active toggle. Drives the homepage brand cards and strip.
- **Catalogues** (`/admin/catalogues`) - upload PDF line cards / catalogues; they appear on `/catalogues`, grouped by brand.
- **Site Settings** (`/admin/settings`) - hero image + copy, headline stats, contact details, social links, SEO defaults, and a **Custom code** box for any extra `<head>` / `<body>` snippet.

### Connect GTM / GA4 / Meta Pixel

Paste **only the ID** into Site Settings (not the whole script); it is injected on every public page automatically.

| Tool | Where to get it | Looks like |
| ---- | --------------- | ---------- |
| Google Tag Manager | tagmanager.google.com -> your container | `GTM-XXXXXXX` |
| Google Analytics 4 | analytics.google.com -> Admin -> Data streams -> web stream -> Measurement ID | `G-XXXXXXXXXX` |
| Meta Pixel | business.facebook.com -> Events Manager -> Data sources -> your pixel | a numeric ID |

Tip: route GA4 and the Pixel **through GTM** and you only need the GTM ID. Turn on the cookie-consent banner (Google Consent Mode) under Privacy & Consent.

## Adding a CRUD module

1. `php artisan make:model Product -mf` (add the `Auditable` trait).
2. `php artisan make:controller Admin/ProductController` (follow `UserController`).
3. Create typed pages under `resources/js/Pages/Admin/Products/*.tsx`
   (use the Users pages as a reference for the `DataTable` and forms).
4. Register routes in `routes/admin.php`.
5. Add a nav item to the `navGroups` array in
   `resources/js/components/admin/AdminLayout.tsx`.

## Testing

```bash
php artisan test                              # full suite
php artisan test --filter=OwaspSecurityTest   # security tests only
```
