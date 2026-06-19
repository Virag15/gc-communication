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
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string[] | string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: string | null;
    canonical_url?: string | null;
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
    brands: number;
    catalogues: number;
    downloads: number;
    new_enquiries: number;
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

/** A distributed brand shown on the public site and managed in admin. */
export interface Brand {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    website: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** A downloadable catalogue / line card (PDF). */
export interface Catalogue {
    id: number;
    title: string;
    brand_id: number | null;
    brand?: Brand | null;
    file: string;
    file_name: string | null;
    file_size: number | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** Status of a customer enquiry. */
export type EnquiryStatus = 'new' | 'read' | 'archived';

/** A contact / enquiry submission from the public site. */
export interface Enquiry {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    message: string;
    status: EnquiryStatus;
    created_at: string;
    updated_at: string;
}

/** A breadcrumb entry rendered in the admin header. */
export interface Breadcrumb {
    label: string;
    href?: string;
}
