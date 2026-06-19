/**
 * Shared application types for the GC Communication admin panel.
 *
 * Domain models mirror the JSON shapes returned by the Laravel controllers,
 * and the shared Inertia props mirror `HandleInertiaRequests::share()`.
 */

/** Roles understood by the access-control middleware. */
export type Role = 'super_admin' | 'admin' | 'editor';

/** The lightweight authenticated user shared with every page. */
export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: Role;
}

/** The `auth` shared prop. */
export interface Auth {
    user: AuthUser | null;
}

/** Branding/config shared from `config/admin.php`. */
export interface AdminConfig {
    name: string;
    logo: string;
    timezone: string;
}

/** One-shot flash messages surfaced as toasts. */
export interface FlashMessages {
    success?: string;
    error?: string;
}

/** Props shared with every Inertia response (see `HandleInertiaRequests`). */
export interface SharedProps {
    auth: Auth;
    admin: AdminConfig;
    flash: FlashMessages;
}

/** A full user record as returned by the Users endpoints. */
export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** SEO settings for a single managed page. */
export interface SeoSetting {
    id?: number;
    page_identifier?: string;
    meta_title: string;
    meta_description: string;
    meta_keywords?: string;
    og_image?: string | null;
    structured_data?: string | null;
    noindex?: boolean;
}

/** A row in the dashboard "recent activity" feed. */
export interface AuditLogEntry {
    id: number;
    user: string;
    action: string;
    model: string;
    created_at: string;
}

/** Dashboard summary statistics. */
export interface DashboardStats {
    total_users: number;
    active_users: number;
}

/** A point on a time-series chart. */
export interface TrendPoint {
    date: string;
    count: number;
}

/** A Laravel length-aware paginator link. */
export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

/** A Laravel length-aware paginator payload. */
export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
    first_page_url: string | null;
    last_page_url: string | null;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
    links: PaginationLink[];
}

/** A breadcrumb entry rendered in the admin header. */
export interface Breadcrumb {
    label: string;
    href?: string;
}
