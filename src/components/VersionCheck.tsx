'use client';

import { useEffect } from 'react';
import { APP_VERSION } from '@/lib/version';

const ATTEMPT_KEY = 'lumen_update_attempt';
// Don't hit the server on every tab switch.
const MIN_CHECK_INTERVAL_MS = 60 * 1000;

async function hardUpdate(serverVersion: string) {
    // One attempt per server version per session, so a CDN still serving the old
    // build can't trap us in a reload loop.
    try {
        if (sessionStorage.getItem(ATTEMPT_KEY) === serverVersion) return;
        sessionStorage.setItem(ATTEMPT_KEY, serverVersion);
    } catch {
        // Without sessionStorage we can't guard against loops; still try once.
    }

    if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
    }
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.update().catch(() => { });

    window.location.reload();
}

async function checkVersion() {
    try {
        const response = await fetch('/api/version', { cache: 'no-store' });
        if (!response.ok) return;
        const { version } = await response.json();
        if (version && version !== APP_VERSION) {
            await hardUpdate(version);
        }
    } catch {
        // Offline or server unreachable: keep running the cached version.
    }
}

/**
 * Compares this bundle's build version with the server's on launch and whenever
 * the app comes back to the foreground; on mismatch, drops all caches and reloads.
 */
export function VersionCheck() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return;

        let lastCheck = 0;
        const run = () => {
            if (Date.now() - lastCheck < MIN_CHECK_INTERVAL_MS) return;
            lastCheck = Date.now();
            checkVersion();
        };
        const onVisible = () => {
            if (document.visibilityState === 'visible') run();
        };

        run();
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, []);

    return null;
}
