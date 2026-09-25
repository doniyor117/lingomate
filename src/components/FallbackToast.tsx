import { useEffect } from 'react';
import { getModelDisplayName } from '@/lib/models';
import { useI18n } from '@/lib/i18n';
import { FALLBACK_DURATION_MS, FallbackNotice } from '@/lib/model-fallback';

interface FallbackToastProps {
    notice: FallbackNotice | null;
    onClose: () => void;
}

const AUTO_DISMISS_MS = 8000;

export function FallbackToast({ notice, onClose }: FallbackToastProps) {
    const { t } = useI18n();
    useEffect(() => {
        if (!notice) return;
        const id = setTimeout(onClose, AUTO_DISMISS_MS);
        return () => clearTimeout(id);
    }, [notice, onClose]);

    if (!notice) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed z-[70] inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-auto sm:top-20 sm:right-6 sm:w-96 animate-fade-in"
        >
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-[var(--surface)] shadow-xl">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div className="flex-1 text-sm">
                    <p className="font-medium text-[var(--foreground)]">
                        {t('toast.failed', { model: getModelDisplayName(notice.failed) })}
                    </p>
                    <p className="text-[var(--text-muted)] mt-0.5">
                        {notice.sticky
                            ? t('toast.using', { model: getModelDisplayName(notice.using), n: FALLBACK_DURATION_MS / 60000 })
                            : t('toast.usingOnce', { model: getModelDisplayName(notice.using) })}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 -m-1 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                    aria-label={t('toast.dismiss')}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
