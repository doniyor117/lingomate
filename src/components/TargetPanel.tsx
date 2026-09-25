import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { TranslationResult } from '@/lib/types';
import { getLanguageByCode } from '@/lib/languages';
import { hasContent, toCopyText } from '@/lib/results';
import { DictionaryView, FindView, SpeechControls } from './ResultViews';

// Only history entries saved by older versions are markdown; load the parser on demand.
const LegacyMarkdown = dynamic(() => import('./TranslationMarkdown'), { ssr: false, loading: () => null });

interface TargetPanelProps {
    result: TranslationResult | null;
    /** ISO code shown as "Detected …" when the source language is auto. */
    detectedLanguage?: string;
    /** Effective source and target, to spot same-language (grammar fix) translations. */
    sourceLang: string;
    targetLang: string;
    error: string;
    isLoading: boolean;
    isStreaming: boolean;
    isSpeakingTarget: boolean;
    handleSpeakTarget: () => void;
    speech: SpeechControls;
}

function languageLabel(code: string) {
    const lang = getLanguageByCode(code);
    return lang ? `${lang.name} ${lang.flag}` : code.toUpperCase();
}

function DetectedLanguage({ code }: { code: string }) {
    return (
        <p className="mb-3 text-xs text-[var(--text-muted)]">
            Detected: <span className="font-medium text-[var(--foreground)]">{languageLabel(code)}</span>
        </p>
    );
}

// Translate mode with text already in the target language returns a corrected version.
function CorrectedNotice({ code }: { code: string }) {
    return (
        <p className="mb-3 text-xs text-[var(--text-muted)]">
            Already in <span className="font-medium text-[var(--foreground)]">{languageLabel(code)}</span> · showing a grammar-corrected version
        </p>
    );
}

function ResultBody({ result, isStreaming, speech }: { result: TranslationResult; isStreaming: boolean; speech: SpeechControls }) {
    switch (result.mode) {
        case 'dictionary':
            return <DictionaryView data={result.data} speech={speech} />;
        case 'find':
            return <FindView data={result.data} speech={speech} />;
        case 'legacy':
            return <div className="markdown-body"><LegacyMarkdown text={result.text} /></div>;
        case 'translate':
            return (
                <p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-[var(--foreground)]">
                    {result.text}
                    {isStreaming && <span className="inline-block w-2 h-5 ml-0.5 align-text-bottom rounded-sm bg-[var(--primary)] animate-pulse" aria-hidden="true" />}
                </p>
            );
    }
}

export function TargetPanel({
    result,
    detectedLanguage,
    sourceLang,
    targetLang,
    error,
    isLoading,
    isStreaming,
    isSpeakingTarget,
    handleSpeakTarget,
    speech
}: TargetPanelProps) {
    const [copied, setCopied] = useState(false);
    const showResult = !error && !isLoading && hasContent(result);

    const handleCopy = async () => {
        if (!result) return;
        const text = toCopyText(result);
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col rounded-xl border border-[var(--border)] glass overflow-hidden min-h-[200px] lg:min-h-0 bg-[var(--surface)]">
            <div className="flex-1 relative p-4 overflow-y-auto" aria-live="polite">
                {error ? (
                    <div className="flex items-start gap-3 text-red-500">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                ) : isLoading ? (
                    <div className="space-y-3 animate-pulse-slow">
                        <div className="h-4 bg-[var(--border)] rounded w-3/4" />
                        <div className="h-4 bg-[var(--border)] rounded w-1/2" />
                        <div className="h-4 bg-[var(--border)] rounded w-5/6" />
                    </div>
                ) : showResult && result ? (
                    <>
                        {result.mode === 'translate' && sourceLang === targetLang ? (
                            <CorrectedNotice code={targetLang} />
                        ) : detectedLanguage && <DetectedLanguage code={detectedLanguage} />}
                        <ResultBody result={result} isStreaming={isStreaming} speech={speech} />
                    </>
                ) : (
                    <p className="text-[var(--text-muted)] italic">Translation will appear here...</p>
                )}
            </div>

            {showResult && !isStreaming && (
                <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--border)] bg-[var(--surface-hover)]">
                    {/* Dictionary and Find a word cards have per-word listen buttons instead. */}
                    {(result?.mode === 'translate' || result?.mode === 'legacy') && (
                        <button
                            onClick={handleSpeakTarget}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${isSpeakingTarget
                                ? 'text-[var(--primary)] bg-[var(--border)] font-medium'
                                : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]'
                                }`}
                            title="Listen"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            {isSpeakingTarget ? 'Playing…' : 'Listen'}
                        </button>
                    )}
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${copied
                            ? 'text-green-600 font-medium'
                            : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]'
                            }`}
                        title="Copy"
                    >
                        {copied ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            )}
        </div>
    );
}
