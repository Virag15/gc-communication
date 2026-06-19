/**
 * Public navigation behaviour:
 *  - transparent over the hero, solid (blurred) once the page is scrolled
 *  - mobile overlay menu (open/close, Esc, scroll-lock)
 *
 * A nav marked data-solid="static" (content pages without a hero) stays solid.
 */
function initNav(): void {
    const nav = document.querySelector<HTMLElement>('.site-nav');

    if (nav && nav.dataset.solid !== 'static') {
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
