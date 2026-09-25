import React, { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const remarkPlugins = [remarkGfm];

// The parent re-renders on every keystroke in the source box; memoizing keeps the
// markdown from being re-parsed unless the translation itself changed.
const TranslationMarkdown = memo(function TranslationMarkdown({ text }: { text: string }) {
    return <ReactMarkdown remarkPlugins={remarkPlugins}>{text}</ReactMarkdown>;
});

interface TargetPanelProps {
    translatedText: string;
    error: string;
    isLoading: boolean;
    modelUsed: string;
    outputMode: string;
    isSpeakingTarget: boolean;
    handleSpeakTarget: () => void;
}

export function TargetPanel({
    translatedText,
    error,
    isLoading,
    modelUsed,
    outputMode,
    isSpeakingTarget,
    handleSpeakTarget
}: TargetPanelProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!translatedText) return;
        try {
            await navigator.clipboard.writeText(translatedText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = translatedText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex flex-col rounded-xl border border-[var(--border)] glass overflow-hidden min-h-[200px] lg:min-h-0 bg-[var(--surface)]">
            <div className="flex-1 relative p-4 overflow-y-auto">
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
                ) : translatedText ? (
                    <div className="markdown-body relative">
                        <div className="float-right ml-3 mb-2 relative z-10">
                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all border shadow-sm bg-[var(--background)]/85 backdrop-blur-sm ${
                                    copied
                                        ? 'text-green-600 border-green-500/20 font-medium'
                                        : 'text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
                                }`}
                                title="Copy"
                            >
                                {copied ? (
                                    <>
                                        <svg className="w-3.5 h-3.5 text-green-600 animate-scale-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <TranslationMarkdown text={translatedText} />
                    </div>
                ) : (
                    <p className="text-[var(--text-muted)] italic">Translation will appear here...</p>
                )}
            </div>

            <div className="flex flex-row items-center justify-start gap-4 sm:gap-6 px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-hover)] w-full overflow-x-auto whitespace-nowrap">
                <div className="flex items-center gap-3 text-xs tracking-wide text-[var(--text-muted)]">
                    {modelUsed && (
                        <span className="flex items-center gap-1.5 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] flex-shrink-0" />
                            {modelUsed}
                        </span>
                    )}
                    {outputMode && (
                        <span className="px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] font-semibold uppercase text-[10px] tracking-wider shadow-sm">
                            {outputMode}
                        </span>
                    )}
                </div>

                {translatedText && (
                    <div className="flex items-center gap-2">
                        {/* Speaker Button */}
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
                            {isSpeakingTarget ? 'Playing...' : 'Listen'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
