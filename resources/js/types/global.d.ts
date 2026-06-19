import type { Page, SharedPageProps } from '@inertiajs/core';
import type { AxiosInstance } from 'axios';

declare global {
    interface Window {
        /** Axios instance configured in `resources/js/bootstrap.ts`. */
        axios: AxiosInstance;
        /**
         * The current Inertia page, mirrored onto `window` so non-React
         * utilities (e.g. `lib/dates.ts`) can read shared props such as the
         * configured timezone. Kept in sync in `resources/js/admin.tsx`.
         */
        __page?: Page<SharedPageProps>;
    }
}

export {};
