import '@inertiajs/core';
import type { Auth, AdminConfig, FlashMessages } from './index';

/**
 * Teach Inertia about the props shared with every page so that
 * `usePage().props` is fully typed across the app.
 *
 * @see resources/js/types/index.ts
 * @see app/Http/Middleware/HandleInertiaRequests.php
 */
declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            auth: Auth;
            admin: AdminConfig;
            flash: FlashMessages;
        };
    }
}
