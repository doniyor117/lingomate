import React, { useState } from 'react';
import { getLanguageByCode } from '@/lib/languages';
import { LanguageModal } from './LanguageModal';
import { useI18n } from '@/lib/i18n';

interface LanguageSelectProps {
    sourceLang: string;
    targetLang: string;
    setSourceLang: (lang: string) => void;
    setTargetLang: (lang: string) => void;
    handleSwapLanguages: () => void;
}

export function LanguageSelect({
    sourceLang,
    targetLang,
    setSourceLang,
    setTargetLang,
    handleSwapLanguages
}: LanguageSelectProps) {
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

    const { t, languageName } = useI18n();
    const sourceObj = getLanguageByCode(sourceLang);
    const targetObj = getLanguageByCode(targetLang);

    return (
        <div className="relative flex items-center p-2 rounded-xl glass bg-[var(--surface)] max-w-2xl mx-auto w-full z-50">
            {/* Source Language Button */}
            <button
                onClick={() => setIsSourceModalOpen(true)}
                className="w-1/2 p-3 pr-8 flex items-center justify-center sm:justify-start gap-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors group"
                aria-label={t('lang.selectSource')}
            >
                <span className="font-medium text-[var(--foreground)] truncate">
                    {sourceObj ? languageName(sourceObj.code) : t('lang.select')}
                </span>
                <span className="flex-shrink-0 text-xl" aria-hidden="true">{sourceObj?.flag}</span>
                <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-colors flex-shrink-0 ml-auto hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Absolute Center Swap Button */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <button
                    onClick={handleSwapLanguages}
                    className="p-2.5 rounded-full hover:bg-[var(--surface-hover)] transition-all active:scale-95 group border border-[var(--border)] bg-[var(--background)] shadow-sm hover:shadow"
                    title={t('lang.swap')}
                    aria-label={t('lang.swap')}
                >
                    <svg className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                </button>
            </div>

            {/* Target Language Button */}
            <button
                onClick={() => setIsTargetModalOpen(true)}
                className="w-1/2 p-3 pl-8 flex items-center justify-center sm:justify-end gap-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors group"
                aria-label={t('lang.selectTarget')}
            >
                <span className="flex-shrink-0 text-xl hidden sm:block" aria-hidden="true">{targetObj?.flag}</span>
                <span className="font-medium text-[var(--foreground)] truncate">
                    {targetObj ? languageName(targetObj.code) : t('lang.select')}
                </span>
                <span className="flex-shrink-0 text-xl sm:hidden" aria-hidden="true">{targetObj?.flag}</span>
                <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-colors flex-shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <LanguageModal
                isOpen={isSourceModalOpen}
                onClose={() => setIsSourceModalOpen(false)}
                onSelect={setSourceLang}
                title={t('lang.from')}
                selectedCode={sourceLang}
            />

            <LanguageModal
                isOpen={isTargetModalOpen}
                onClose={() => setIsTargetModalOpen(false)}
                onSelect={setTargetLang}
                title={t('lang.to')}
                hideAuto={true}
                selectedCode={targetLang}
            />
        </div>
    );
}
