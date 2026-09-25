'use client';

import { TranslationEntry, useHistory, deleteHistoryEntry, clearHistory } from '@/lib/history';
import { entryToResult, toPreview } from '@/lib/results';
import { modeKey } from '@/lib/modes';
import { formatRelativeTime, useI18n } from '@/lib/i18n';
import { ModeIcon } from './ModePicker';

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (entry: TranslationEntry) => void;
}

export function HistorySidebar({ isOpen, onClose, onSelect }: HistorySidebarProps) {
    const history = useHistory();
    const { t, uiLang, languageName } = useI18n();
    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteHistoryEntry(id);
    };

    const handleClear = () => {
        if (confirm(t('history.confirmClear'))) {
            clearHistory();
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-[var(--background)] border-l border-[var(--border)] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold">{t('history.title')}</h2>
                    <div className="flex items-center gap-2">
                        {history.length > 0 && (
                            <button
                                onClick={handleClear}
                                className="text-sm text-red-500 hover:text-red-600 transition-colors"
                            >
                                {t('history.clearAll')}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                            aria-label={t('history.close')}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] px-4">
                            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm">{t('history.empty')}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--border)]">
                            {history.map((entry) => (
                                <div
                                    key={entry.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onSelect(entry)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(entry); } }}
                                    className="w-full py-3.5 pl-4 pr-3 text-left hover:bg-[var(--surface-hover)] transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1 min-w-0">
                                        {entry.mode && (
                                            <span className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--foreground)] font-medium whitespace-nowrap" title={t(modeKey(entry.mode, 'label'))}>
                                                <ModeIcon mode={entry.mode} className="w-3 h-3" />
                                                {t(modeKey(entry.mode, 'label'))}
                                            </span>
                                        )}
                                        <span className="truncate min-w-0">
                                            {languageName(entry.sourceLang)} → {languageName(entry.targetLang)}
                                        </span>
                                        {/* Flush right, so it never pushes into the languages or the text. */}
                                        <span className="ml-auto pl-1 flex-shrink-0 whitespace-nowrap text-[11px] opacity-80">
                                            {formatRelativeTime(entry.timestamp, uiLang, t('time.now'))}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium truncate mb-1">{entry.sourceText}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="flex-1 min-w-0 text-sm text-[var(--text-muted)] truncate">{toPreview(entryToResult(entry))}</p>
                                        {/* Always visible on touch screens, where there's no hover. */}
                                        <button
                                            onClick={(e) => handleDelete(entry.id, e)}
                                            className="-my-1 p-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-60 hover:bg-[var(--surface)] rounded transition-all"
                                            aria-label={t('history.delete')}
                                        >
                                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}
