import { useCallback, useSyncExternalStore } from 'react';

/**
 * localStorage-backed values that React components can subscribe to.
 * Writes notify every subscriber in this tab; the `storage` event covers other tabs.
 */

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    window.addEventListener('storage', listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', listener);
    };
}

export function readStored(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function writeStored(key: string, value: string | null) {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch {
        // Storage can be unavailable (private mode, quota exceeded).
    }
    listeners.forEach((listener) => listener());
}

/** Raw stored string; `null` during server render and hydration's first pass. */
export function useStoredString(key: string): string | null {
    return useSyncExternalStore(
        subscribe,
        () => readStored(key),
        () => null
    );
}

/** A stored string with a fallback and optional validation, plus a setter. */
export function useStoredValue<T extends string>(
    key: string,
    fallback: T,
    isValid: (value: string) => boolean = () => true
): [T, (value: T) => void] {
    const raw = useStoredString(key);
    const value = raw !== null && isValid(raw) ? (raw as T) : fallback;
    const setValue = useCallback((next: T) => writeStored(key, next), [key]);
    return [value, setValue];
}
