import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Marks the form dirty when watched values change after initial load.
 */
export function useAutoFormDirty(watchDeps, { enabled = true, loading = false } = {}) {
    const [isDirty, setIsDirty] = useState(false);
    const hydratedRef = useRef(false);
    const baselineDepsRef = useRef([]);
    const shouldResetBaselineRef = useRef(false);
    const wasLoadingRef = useRef(loading);

    const resetDirty = useCallback(() => {
        shouldResetBaselineRef.current = true;
        hydratedRef.current = true;
        setIsDirty((prev) => (prev ? false : prev));
    }, []);

    const markDirty = useCallback(() => {
        if (enabled) setIsDirty(true);
    }, [enabled]);

    useEffect(() => {
        const wasLoading = wasLoadingRef.current;
        wasLoadingRef.current = loading;

        if (loading) {
            hydratedRef.current = false;
            baselineDepsRef.current = [];
            shouldResetBaselineRef.current = false;
            setIsDirty((prev) => (prev ? false : prev));
            return;
        }

        // Freshly loaded data — establish baseline once, never mark dirty on this transition.
        if (wasLoading || shouldResetBaselineRef.current) {
            hydratedRef.current = true;
            baselineDepsRef.current = watchDeps;
            shouldResetBaselineRef.current = false;
            setIsDirty((prev) => (prev ? false : prev));
            return;
        }

        if (!hydratedRef.current) {
            hydratedRef.current = true;
            baselineDepsRef.current = watchDeps;
            setIsDirty((prev) => (prev ? false : prev));
            return;
        }

        const hasChanged = watchDeps.some((dep, index) => dep !== baselineDepsRef.current[index]);
        if (hasChanged && enabled) {
            setIsDirty((prev) => (prev ? prev : true));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- watchDeps is the intentional dirty signal
    }, [loading, enabled, ...watchDeps]);

    return { isDirty, setIsDirty, resetDirty, markDirty };
}
