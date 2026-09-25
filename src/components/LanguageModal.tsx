import React, { useState, useEffect } from 'react';
import { languages } from '@/lib/languages';
import { useI18n } from '@/lib/i18n';

interface LanguageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (code: string) => void;
    title: string;
    hideAuto?: boolean;
    selectedCode: string;
}

// Only mounted while open, so the search box starts empty every time.
export function LanguageModal({ isOpen, ...props }: LanguageModalProps) {
    return isOpen ? <LanguageModalContent {...props} /> : null;
}

function LanguageModalContent({
    onClose,
    onSelect,
    title,
    hideAuto = false,
    selectedCode
}: Omit<LanguageModalProps, 'isOpen'>) {
    const [searchQuery, setSearchQuery] = useState('');
    const { t, languageName } = useI18n();

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    // Match the localized name as well as the English and native names.
    const query = searchQuery.trim().toLowerCase();
    let displayLanguages = query
        ? languages.filter((l) =>
            [languageName(l.code), l.name, l.nativeName, l.code].some((n) => n.toLowerCase().includes(query)))
        : languages;

    if (hideAuto) {
        displayLanguages = displayLanguages.filter(l => l.code !== 'auto');
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-fade-in p-0 sm:p-6">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                onClick={onClose}
                aria-hidden="true"
            />
            
            <div className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col h-[85vh] sm:h-[70vh]">
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-hover)]">
                    <div className="relative">
                        <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder={t('lang.search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none transition-shadow text-[var(--foreground)]"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {displayLanguages.length === 0 ? (
                        <div className="text-center py-10 text-[var(--text-muted)]">
                            {t('lang.notFound', { q: searchQuery })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {displayLanguages.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        onSelect(lang.code);
                                        onClose();
                                    }}
                                    className={`flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                                        selectedCode === lang.code
                                            ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                                            : 'hover:bg-[var(--surface-hover)] text-[var(--foreground)]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl" aria-hidden="true">{lang.flag}</span>
                                        <span className="truncate">{languageName(lang.code)}</span>
                                    </div>
                                    {selectedCode === lang.code && (
                                        <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
