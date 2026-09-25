import { useEffect, useRef, useState } from 'react';
import { AUTO_DICTIONARY_MAX_WORDS, MODE_IDS, modeKey } from '@/lib/modes';
import { useI18n } from '@/lib/i18n';
import { TranslationMode } from '@/lib/types';

interface ModePickerProps {
    value: TranslationMode;
    onChange: (mode: TranslationMode) => void;
}

const ICONS: Record<TranslationMode, string> = {
    // sparkles
    auto: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z',
    // book
    dictionary: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    // language
    translate: 'M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802',
    // magnifier
    find: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
};

export function ModeIcon({ mode, className }: { mode: TranslationMode; className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[mode]} />
        </svg>
    );
}

/**
 * Compact mode dropdown for the input toolbar. The menu is positioned against the
 * nearest `relative` ancestor (the toolbar), so it stays on screen on narrow phones.
 */
export function ModePicker({ value, onChange }: ModePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const { t } = useI18n();
    const currentLabel = t(modeKey(value, 'label'));

    useEffect(() => {
        if (!isOpen) return;
        const onPointer = (e: PointerEvent) => {
            const target = e.target as Node;
            if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) setIsOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        };
        document.addEventListener('pointerdown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [isOpen]);

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label={t('mode.button', { mode: currentLabel })}
                className={`h-8 pl-2.5 pr-2 flex items-center gap-1.5 rounded-full border text-xs font-medium transition-colors ${isOpen
                    ? 'border-[var(--primary)] text-[var(--primary)] bg-accent/10'
                    : 'border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
                    }`}
            >
                <ModeIcon mode={value} className="w-4 h-4" />
                <span className="whitespace-nowrap">{currentLabel}</span>
                <svg className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div
                    ref={menuRef}
                    role="menu"
                    className="absolute left-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-3rem)] p-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl animate-scale-in origin-top-left"
                >
                    {MODE_IDS.map((id) => {
                        const selected = id === value;
                        return (
                            <button
                                key={id}
                                type="button"
                                role="menuitemradio"
                                aria-checked={selected}
                                onClick={() => {
                                    onChange(id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${selected ? 'bg-accent/10' : 'hover:bg-[var(--surface-hover)]'}`}
                            >
                                <ModeIcon mode={id} className={`w-5 h-5 mt-0.5 flex-shrink-0 ${selected ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                                <span className="flex-1 min-w-0">
                                    <span className={`block text-sm font-medium ${selected ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>
                                        {t(modeKey(id, 'label'))}
                                    </span>
                                    <span className="block text-xs text-[var(--text-muted)] mt-0.5">{t(modeKey(id, 'desc'), { n: AUTO_DICTIONARY_MAX_WORDS })}</span>
                                </span>
                                {selected && (
                                    <svg className="w-4 h-4 mt-1 flex-shrink-0 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </>
    );
}
