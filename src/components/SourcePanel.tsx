import React, { useRef } from 'react';
import { MAX_CHARS, CONTEXT_PRESETS } from '@/lib/constants';
import { getModeInfo } from '@/lib/modes';
import { TranslationMode } from '@/lib/types';
import { ModePicker } from './ModePicker';

interface SourcePanelProps {
    sourceText: string;
    setSourceText: (text: string) => void;
    context: string;
    setContext: (text: string) => void;
    showContext: boolean;
    setShowContext: (show: boolean) => void;
    mode: TranslationMode;
    onModeChange: (mode: TranslationMode) => void;
    handleTranslate: () => void;
    onCancel: () => void;
    isBusy: boolean;
    isListening: boolean;
    toggleListening: () => void;
    isSpeakingSource: boolean;
    handleSpeakSource: (text: string) => void;
    handleClear: () => void;
}

const iconButton = 'p-1.5 rounded-full transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]';

export function SourcePanel({
    sourceText,
    setSourceText,
    context,
    setContext,
    showContext,
    setShowContext,
    mode,
    onModeChange,
    handleTranslate,
    onCancel,
    isBusy,
    isListening,
    toggleListening,
    isSpeakingSource,
    handleSpeakSource,
    handleClear
}: SourcePanelProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isOverLimit = sourceText.length > MAX_CHARS;
    const canSend = !!sourceText.trim() && !isOverLimit;
    const contextActive = showContext || !!context;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (canSend) handleTranslate();
        }
    };

    return (
        // z-10 keeps the mode menu above the result panel when it overlaps it on mobile.
        <div className="relative z-10 flex flex-col rounded-xl border border-[var(--border)] focus-within:!border-blue-500/50 transition-colors glass min-h-[200px] lg:min-h-0 bg-[var(--surface)]">
            <div className="flex-1 relative">
                <textarea
                    ref={textareaRef}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={getModeInfo(mode).placeholder}
                    className="w-full h-full min-h-[140px] p-4 bg-transparent resize-none outline-none text-lg text-[var(--foreground)] placeholder:text-[var(--text-muted)]"
                    autoFocus
                />
                {isOverLimit && (
                    <span className="absolute bottom-2 right-4 text-xs text-red-500">
                        {sourceText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                    </span>
                )}
            </div>

            <div className="relative flex items-center gap-1.5 px-3 py-2 border-t border-[var(--border)] bg-[var(--surface-hover)] last:rounded-b-xl">
                <div className="flex items-center text-[var(--text-muted)]">
                    <button
                        onClick={toggleListening}
                        className={isListening ? 'p-1.5 rounded-full bg-red-500 text-white animate-pulse' : iconButton}
                        title="Speech to text"
                        aria-label="Use voice input"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </button>

                    {sourceText && (
                        <>
                            <button
                                onClick={() => handleSpeakSource(sourceText)}
                                className={isSpeakingSource ? 'p-1.5 rounded-full text-[var(--primary)] bg-[var(--surface)]' : iconButton}
                                title="Listen to input"
                                aria-label="Listen to input"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            </button>

                            <button
                                onClick={() => {
                                    handleClear();
                                    textareaRef.current?.focus();
                                }}
                                className={iconButton}
                                title="Clear text"
                                aria-label="Clear text"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setShowContext(!showContext)}
                    aria-pressed={showContext}
                    aria-label="Context"
                    title="Add context (tone, audience, domain)"
                    className={`relative h-8 px-2.5 flex items-center gap-1.5 rounded-full border text-xs font-medium transition-colors ${contextActive
                        ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                    <span className="hidden min-[400px]:inline">Context</span>
                    {context && !showContext && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--primary)]" aria-hidden="true" />
                    )}
                </button>

                <ModePicker value={mode} onChange={onModeChange} />

                <div className="flex-1" />

                <button
                    type="button"
                    onClick={isBusy ? onCancel : handleTranslate}
                    disabled={!isBusy && !canSend}
                    aria-label={isBusy ? 'Stop' : 'Translate'}
                    title={isBusy ? 'Stop' : 'Translate (Ctrl+Enter)'}
                    className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 ${isBusy
                        ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
                        : canSend
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95'
                            : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
                        }`}
                >
                    {isBusy ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <rect x="4" y="4" width="16" height="16" rx="3" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6.5 6.5M12 5l6.5 6.5" />
                        </svg>
                    )}
                </button>
            </div>

            {showContext && (
                <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-hover)] last:rounded-b-xl">
                    <input
                        type="text"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        maxLength={500}
                        placeholder="Add context (e.g., 'formal email', 'technical documentation')"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm focus:ring-2 focus:ring-[var(--primary)] text-[var(--foreground)] placeholder-[var(--text-muted)]"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {CONTEXT_PRESETS.map((preset) => {
                            const isActive = context.toLowerCase() === preset.value.toLowerCase();
                            return (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => setContext(isActive ? '' : preset.value)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${isActive
                                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                        : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
