import { useRef, useCallback } from 'react';

/**
 * Returns a stable, debounced version of `callback`. Subsequent calls within
 * `delay` ms reset the timer; only the final call fires.
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
    callback: (...args: TArgs) => void,
    delay = 300,
): (...args: TArgs) => void {
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    return useCallback(
        (...args: TArgs) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => callback(...args), delay);
        },
        [callback, delay],
    );
}
