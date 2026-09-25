import { readStored, writeStored } from './storage';

/**
 * When the preferred model fails and the server falls back to another one,
 * stick with the fallback for a while instead of retrying the failing model
 * (and paying for its failure) on every request.
 */

const FALLBACK_KEY = 'lumen_model_fallback';
export const FALLBACK_DURATION_MS = 15 * 60 * 1000;

interface FallbackState {
    from: string;
    to: string;
    until: number;
}

export interface FallbackNotice {
    failed: string;
    using: string;
    /** True when `using` will be kept for the fallback window. */
    sticky: boolean;
}

function readState(): FallbackState | null {
    try {
        const state = JSON.parse(readStored(FALLBACK_KEY) || 'null');
        return state && typeof state.until === 'number' ? state : null;
    } catch {
        return null;
    }
}

/** Which model to request: the fallback while it's active, otherwise the preferred one. */
export function pickModel(preferred: string): string {
    const state = readState();
    if (state && state.from === preferred && state.until > Date.now()) return state.to;
    return preferred;
}

/**
 * Updates the fallback state from what the server actually used, and returns a
 * notice when the requested model failed and another one answered instead.
 */
export function recordModelResult(preferred: string, requested: string, used: string): FallbackNotice | null {
    if (used === preferred) {
        // The preferred model answered (first try or after the fallback window): back to normal.
        writeStored(FALLBACK_KEY, null);
    } else {
        // Either the preferred model just failed, or we're still inside the fallback window.
        const state = readState();
        const keepWindow = state && state.from === preferred && state.to === used && state.until > Date.now();
        if (!keepWindow) {
            writeStored(FALLBACK_KEY, JSON.stringify({ from: preferred, to: used, until: Date.now() + FALLBACK_DURATION_MS }));
        }
    }

    return used !== requested ? { failed: requested, using: used, sticky: used !== preferred } : null;
}
