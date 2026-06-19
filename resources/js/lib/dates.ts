import { format } from 'date-fns';

type DateInput = string | number | Date | null | undefined;

/**
 * Get the timezone from Inertia shared props.
 * Falls back to UTC. Set via config/admin.php → ADMIN_TIMEZONE.
 */
function getTz(): string {
    try {
        return window.__page?.props?.admin?.timezone || 'UTC';
    } catch {
        return 'UTC';
    }
}

/**
 * Format: "March 30, 2026, 1:00 PM"
 */
export function formatDateTime(value: DateInput): string {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: getTz(),
    });
}

/**
 * Format: "March 30, 2026"
 */
export function formatDate(value: DateInput): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: getTz(),
    });
}

/**
 * Format: "1:00 PM"
 */
export function formatTime(value: DateInput): string {
    if (!value) return '—';
    return new Date(value).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: getTz(),
    });
}

/**
 * Short date for chart axes: "Mar 30"
 */
export function formatShortDate(value: DateInput): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: getTz(),
    });
}

/**
 * Format a Date to an ISO date string for the backend: "2026-03-30"
 */
export function toISODate(date: Date | null | undefined): string {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
}
