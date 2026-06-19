import { useEffect, useRef, useCallback, useState } from 'react';

const AUTOSAVE_DELAY = 1000;

export interface UseAutosaveResult {
    /** Whether a previously saved draft was restored on mount. */
    restored: boolean;
    /** Remove the persisted draft and reset the restored flag. */
    clearDraft: () => void;
    /** Dismiss the "draft restored" notice without deleting the draft. */
    dismissDraft: () => void;
}

/**
 * Persists an Inertia form's data to `localStorage` and restores it on mount.
 * `File` values (and arrays containing files) are skipped, since they cannot be
 * serialized.
 *
 * `setData` is intentionally permissive - it accepts the Inertia `useForm`
 * setter, whose key/value types are too narrow to express here generically.
 */
export function useAutosave(
    key: string,
    data: Record<string, unknown>,
    setData: (...args: never[]) => void,
    enabled = true,
    excludeKeys: string[] = [],
): UseAutosaveResult {
    const storageKey = `draft:${key}`;
    const [restored, setRestored] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!enabled || initializedRef.current) return;
        initializedRef.current = true;

        try {
            const saved = localStorage.getItem(storageKey);
            if (!saved) return;

            const parsed = JSON.parse(saved) as Record<string, unknown>;
            const hasContent = Object.entries(parsed).some(([, value]) => {
                if (typeof value === 'string') return value.length > 0;
                if (Array.isArray(value)) return value.length > 0;
                if (typeof value === 'number') return value !== 0;
                return false;
            });

            if (hasContent) {
                for (const [field, value] of Object.entries(parsed)) {
                    if (value instanceof File) continue;
                    try {
                        (setData as (field: string, value: unknown) => void)(field, value);
                    } catch {
                        /* skip unsupported fields */
                    }
                }
                setRestored(true);
            }
        } catch {
            localStorage.removeItem(storageKey);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!enabled || !initializedRef.current) return;
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            try {
                const serializable: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(data)) {
                    if (excludeKeys.includes(k)) continue;
                    if (v instanceof File) continue;
                    if (Array.isArray(v) && v.some((item) => item instanceof File)) continue;
                    serializable[k] = v;
                }
                localStorage.setItem(storageKey, JSON.stringify(serializable));
            } catch {
                /* storage full */
            }
        }, AUTOSAVE_DELAY);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [data, enabled, storageKey, excludeKeys]);

    const clearDraft = useCallback(() => {
        localStorage.removeItem(storageKey);
        setRestored(false);
    }, [storageKey]);

    const dismissDraft = useCallback(() => {
        setRestored(false);
    }, []);

    return { restored, clearDraft, dismissDraft };
}
