import { createInertiaApp, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import type { ComponentType } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';

const errorMessages: Record<number, string> = {
    409: 'This action conflicts with another request. Please try again.',
    419: 'Your session has expired. Please refresh the page.',
    422: 'Please check the form for errors.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Something went wrong on our end. Please try again later.',
    503: 'Service is temporarily unavailable. Please try again later.',
};

// Surface HTTP-level failures (expired session, server errors, non-Inertia
// responses) as toasts. `httpException` and `networkError` are the Inertia v3
// events for these cases.
router.on('httpException', (event) => {
    const status = event.detail.response.status;
    if (errorMessages[status]) {
        toast.error(errorMessages[status]);
    } else if (status >= 400) {
        toast.error(`Request failed (${status}). Please try again.`);
    }
});

router.on('networkError', () => {
    toast.error('An unexpected error occurred. Please try again.');
});

type PageModule = { default: ComponentType<Record<string, unknown>> };

createInertiaApp({
    title: (title) => {
        const name = window.__page?.props?.admin?.name || 'GC Communication';
        return title ? `${title} - ${name}` : name;
    },
    resolve: (name) => {
        const pages = import.meta.glob<PageModule>('./Pages/**/*.tsx', { eager: true });
        const page = pages[`./Pages/${name}.tsx`];
        if (!page) {
            console.error(`Page not found: ${name}. Available:`, Object.keys(pages));
            throw new Error(`Page component "${name}" not found.`);
        }
        return page.default;
    },
    setup({ el, App, props }) {
        // Mirror the current page onto window so non-React utilities can read
        // shared props (brand name, timezone). Keep it fresh on navigation.
        window.__page = props.initialPage;
        router.on('navigate', (event) => {
            window.__page = event.detail.page;
        });

        createRoot(el).render(
            <TooltipProvider>
                <App {...props} />
            </TooltipProvider>
        );
    },
}).catch((err: unknown) => {
    console.error('Inertia app failed to initialize:', err);
    const el = document.getElementById('app');
    if (el && err instanceof Error) {
        el.innerHTML = `<div style="padding:2rem;color:red;font-family:monospace"><h2>App Error</h2><pre>${err.message}\n${err.stack}</pre></div>`;
    }
});
