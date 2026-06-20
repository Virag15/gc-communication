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
    og_type?: string | null;
    og_image?: string | null;
    canonical_url?: string | null;
    structured_data?: string | null;
    noindex?: boolean;
    robots?: string | null;
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

/** A catalog product the estimate creator searches and prices. */
export interface Product {
    id: number;
    item_no: string;
    name: string;
    spec: string | null;
    price: number;
    mrp: number | null;
    brand_id: number | null;
    brand?: Brand | null;
    category: string | null;
    bulk: string | null;
    image: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

/** A blog post (rich text + per-post SEO). */
export interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    body: string | null;
    cover_image: string | null;
    author: string | null;
    status: 'draft' | 'published';
    published_at: string | null;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string[] | null;
    og_image: string | null;
    noindex: boolean;
    created_at: string;
    updated_at: string;
}

/** A lighter post row for the listing table. */
export type PostListItem = Pick<Post, 'id' | 'title' | 'slug' | 'status' | 'published_at' | 'updated_at'>;

/** A customer selectable in the estimate creator. */
export interface Customer {
    id: number;
    name: string;
    company: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    gstin: string | null;
    ref_by: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

/** A customer snapshot stored on an estimate. */
export interface EstimateCustomerSnapshot {
    name: string;
    company?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    gstin?: string | null;
    ref_by?: string | null;
}

/** A line item on an estimate / Bill of Materials. */
export interface EstimateLineItem {
    product_id?: number | null;
    item_no: string;
    name: string;
    spec?: string | null;
    qty: number;
    unit_price: number;
    mrp?: number | null;
    image?: string | null;
}

/** A saved estimate (Bill of Materials). */
export interface Estimate {
    id: number;
    estimate_no: string;
    customer_id: number | null;
    customer: EstimateCustomerSnapshot;
    line_items: EstimateLineItem[];
    special_discount: number;
    delivery_fee: number;
    express: boolean;
    gst_pct: number;
    show_prices: boolean;
    show_scheme: boolean;
    template: string;
    accent: string;
    item_total: number;
    scheme_off: number;
    gst_amt: number;
    grand_total: number;
    status: string;
    created_at: string;
    updated_at: string;
}

/** A lighter estimate row for the listing table. */
export type EstimateListItem = Pick<Estimate, 'id' | 'estimate_no' | 'customer' | 'grand_total' | 'status' | 'created_at' | 'updated_at'>;

/** Global estimate / PDF branding settings. */
export interface EstimateSetting {
    id: number;
    company_name: string;
    prepared_by: string | null;
    doc_title: string;
    note: string | null;
    terms: string | null;
    valid_days: number;
    template: string;
    accent: string;
    paper: string;
    font: string;
    footer_color: string;
    side_color: string;
    wordmark_color: string;
    logos_pos: string;
    photos: boolean;
    show_prices: boolean;
    show_scheme: boolean;
    use_brand_logos: boolean;
    gst_pct: number;
    watermark: string | null;
    dealer_addr1: string | null;
    dealer_addr2: string | null;
    dealer_phone: string | null;
    dealer_email: string | null;
    dealer_website: string | null;
    dealer_gstin: string | null;
    logo: string | null;
}
