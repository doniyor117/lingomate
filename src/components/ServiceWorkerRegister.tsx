'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        // Register after the page has loaded so the SW's precache downloads don't
        // compete with the first render.
        const register = () => {
            navigator.serviceWorker.register('/sw.js').catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
        };

        if (document.readyState === 'complete') {
            register();
        } else {
            window.addEventListener('load', register, { once: true });
            return () => window.removeEventListener('load', register);
        }
    }, []);

    return null;
}
