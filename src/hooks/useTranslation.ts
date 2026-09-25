import { useState, useCallback, useRef, useEffect } from 'react';
import { saveTranslation } from '@/lib/history';
import { TranslationEntry, TranslationMode, TranslationResult } from '@/lib/types';
import { resolveModel } from '@/lib/models';
import { resolveMode } from '@/lib/modes';
import { entryToResult, hasContent, parseOutput, parseTranslateOutput, serializeResult } from '@/lib/results';
import { FallbackNotice, pickModel, recordModelResult } from '@/lib/model-fallback';

interface UseTranslationParams {
    sourceLang: string;
    targetLang: string;
    context: string;
    mode: TranslationMode;
    model: string;
    initialEntry?: TranslationEntry | null;
}

export function useTranslation({
    sourceLang,
    targetLang,
    context,
    mode,
    model,
    initialEntry
}: UseTranslationParams) {
    const [sourceText, setSourceText] = useState(initialEntry?.sourceText ?? '');
    const [result, setResult] = useState<TranslationResult | null>(() => initialEntry ? entryToResult(initialEntry) : null);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState('');
    const [fallbackNotice, setFallbackNotice] = useState<FallbackNotice | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const cancelTranslation = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setIsBusy(false);
    }, []);

    useEffect(() => () => abortRef.current?.abort(), []);

    const handleTranslate = useCallback(async () => {
        const text = sourceText.trim();
        if (!text) return;

        // A new request supersedes whatever is still streaming.
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const outputMode = resolveMode(mode, text);
        const expectLangTag = sourceLang === 'auto';
        const preferred = resolveModel(model);
        const requested = pickModel(preferred);
        const trimmedContext = context.trim() || undefined;

        setIsBusy(true);
        setError('');
        setResult(null);

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    text,
                    sourceLang,
                    targetLang,
                    context: trimmedContext,
                    mode: outputMode,
                    model: requested,
                }),
            });

            if (!response.ok || !response.body) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Translation failed');
            }

            const used = response.headers.get('X-Model');
            if (used) {
                const notice = recordModelResult(preferred, requested, used);
                if (notice) setFallbackNotice(notice);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let raw = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                raw += decoder.decode(value, { stream: true });
                // Plain translations stream in; structured results appear once complete.
                if (outputMode === 'translate') setResult(parseTranslateOutput(raw, expectLangTag));
            }
            raw += decoder.decode();

            let final: TranslationResult;
            try {
                final = parseOutput(outputMode, raw, expectLangTag);
            } catch {
                throw new Error('Couldn’t read the response. Please try again.');
            }
            setResult(final);

            saveTranslation({
                sourceText: text,
                ...serializeResult(final),
                sourceLang,
                targetLang,
                context: trimmedContext,
            });
        } catch (err) {
            if (controller.signal.aborted) return;
            setError(err instanceof Error ? err.message : 'Translation failed');
        } finally {
            if (abortRef.current === controller) {
                abortRef.current = null;
                setIsBusy(false);
            }
        }
    }, [sourceText, sourceLang, targetLang, context, mode, model]);

    const dismissFallbackNotice = useCallback(() => setFallbackNotice(null), []);

    const clearResult = useCallback(() => {
        setResult(null);
        setError('');
    }, []);

    // Skeleton until something can be shown, then (for translations) the text streams in.
    const isLoading = isBusy && !hasContent(result);

    return {
        sourceText,
        setSourceText,
        result,
        isBusy,
        isLoading,
        error,
        handleTranslate,
        cancelTranslation,
        clearResult,
        fallbackNotice,
        dismissFallbackNotice
    };
}
