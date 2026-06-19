/**
 * Public navigation behaviour:
 *  - floating pill nav gains a subtle blurred backdrop once the page is scrolled
 *  - mobile overlay menu (open/close, Esc, scroll-lock)
 */
function initNav(): void {
    const nav = document.querySelector<HTMLElement>('.site-nav');

    if (nav) {
        const sync = () => nav.classList.toggle('is-solid', window.scrollY > 8);
        sync();
        window.addEventListener('scroll', sync, { passive: true });
    }

    const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
    const menu = document.querySelector<HTMLElement>('[data-nav-menu]');
    const closeBtn = document.querySelector<HTMLButtonElement>('[data-nav-close]');

    if (!toggle || !menu) return;

    const open = () => {
        menu.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        document.documentElement.classList.add('nav-locked');
    };
    const close = () => {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.documentElement.classList.remove('nav-locked');
    };

    toggle.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
}

if (document.readyState !== 'loading') {
    initNav();
} else {
    document.addEventListener('DOMContentLoaded', initNav);
}
