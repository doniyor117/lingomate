import { promptInstall, useInstallStatus } from '@/lib/install';

/** Install prompt shown at the top of Settings until the app is installed. */
export function InstallCard() {
    const status = useInstallStatus();
    if (status === 'installed') return null;

    const hint = {
        available: 'Opens instantly from your home screen and works offline.',
        ios: 'In Safari, tap Share, then “Add to Home Screen”.',
        manual: 'Open your browser menu and choose “Install app” or “Add to Home screen”.',
    }[status];

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-600/10">
            <svg className="w-9 h-9 p-2 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />
            </svg>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">Install LumenAI</p>
                <p className="text-xs text-[var(--text-muted)]">{hint}</p>
            </div>
            {status === 'available' && (
                <button
                    onClick={promptInstall}
                    className="px-3.5 py-2 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium shadow-md shadow-blue-500/30 hover:shadow-lg active:scale-95 transition-all"
                >
                    Install
                </button>
            )}
        </div>
    );
}
