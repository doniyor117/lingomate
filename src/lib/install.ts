import { useSyncExternalStore } from 'react';

/**
 * PWA install state. The browser fires `beforeinstallprompt` once, early, so an
 * inline script in layout.tsx catches it into `window.__installPrompt` before React
 * loads; this module picks it up from there and keeps listening afterwards.
 */

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
    interface Window {
        __installPrompt?: BeforeInstallPromptEvent | null;
    }
}

/**
 * - installed: running as the installed app
 * - available: the browser can show its install dialog
 * - ios: iOS Safari, which only supports Share → Add to Home Screen
 * - manual: no install dialog available (other browsers, or dismissed earlier)
 */
export type InstallStatus = 'installed' | 'available' | 'ios' | 'manual';

const listeners = new Set<() => void>();
let installedNow = false;
let listening = false;

function notify() {
    listeners.forEach((l) => l());
}

function startListening() {
    if (listening) return;
    listening = true;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.__installPrompt = e as BeforeInstallPromptEvent;
        notify();
    });
    window.addEventListener('appinstalled', () => {
        installedNow = true;
        window.__installPrompt = null;
        notify();
    });
    window.matchMedia('(display-mode: standalone)').addEventListener('change', notify);
}

function isIos() {
    const ua = navigator.userAgent;
    return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function getStatus(): InstallStatus {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
        || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (installedNow || standalone) return 'installed';
    if (window.__installPrompt) return 'available';
    return isIos() ? 'ios' : 'manual';
}

function subscribe(listener: () => void) {
    startListening();
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useInstallStatus(): InstallStatus {
    // 'installed' on the server/first render so nothing install-related flashes.
    return useSyncExternalStore(subscribe, getStatus, () => 'installed');
}

/** Shows the browser's install dialog. */
export async function promptInstall(): Promise<void> {
    const event = window.__installPrompt;
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    // The event can't be reused either way.
    window.__installPrompt = null;
    if (outcome === 'accepted') installedNow = true;
    notify();
}
