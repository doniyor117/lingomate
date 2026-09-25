import { useState, useCallback, useRef, useEffect } from 'react';
import { saveTranslation } from '@/lib/history';
import { TranslationEntry, TranslationMode, TranslationResult } from '@/lib/types';
import { resolveModel } from '@/lib/models';
import { resolveMode } from '@/lib/modes';
import { entryToResult, hasContent, parseOutput, parseTranslateOutput, serializeResult } from '@/lib/results';
import { FallbackNotice, pickModel, recordModelResult } from '@/lib/model-fallback';
import { useI18n } from '@/lib/i18n';

interface UseTranslationParams {
    sourceLang: string;
    targetLang: string;
    context: string;
    mode: TranslationMode;
    model: string;
    initialEntry?: TranslationEntry | null;
    /** Text restored from a saved draft; takes precedence over the entry's text. */
    initialText?: string;
}

export function useTranslation({
    sourceLang,
    targetLang,
    context,
    mode,
    model,
    initialEntry,
    initialText
}: UseTranslationParams) {
    const [sourceText, setSourceText] = useState(initialText ?? initialEntry?.sourceText ?? '');
    const [result, setResult] = useState<TranslationResult | null>(() => initialEntry ? entryToResult(initialEntry) : null);
    // The history entry behind the result on screen, so a reload can bring the result back.
    const [entryId, setEntryId] = useState<string | undefined>(initialEntry?.id);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState('');
    const [fallbackNotice, setFallbackNotice] = useState<FallbackNotice | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const { t } = useI18n();

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
        setEntryId(undefined);

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
                // Server-side failures get a friendly message; validation errors say what's wrong.
                throw new Error(response.status < 500 && data.error ? data.error : t('error.failed'));
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
                throw new Error(t('error.unreadable'));
            }
            setResult(final);

            const saved = saveTranslation({
                sourceText: text,
                ...serializeResult(final),
                selectedMode: mode,
                sourceLang,
                targetLang,
                context: trimmedContext,
            });
            setEntryId(saved.id);
        } catch (err) {
            if (controller.signal.aborted) return;
            // fetch() rejects with a TypeError on network failures; its message is browser-specific.
            setError(err instanceof Error && !(err instanceof TypeError) ? err.message : t('error.failed'));
        } finally {
            if (abortRef.current === controller) {
                abortRef.current = null;
                setIsBusy(false);
            }
        }
    }, [sourceText, sourceLang, targetLang, context, mode, model, t]);

    const dismissFallbackNotice = useCallback(() => setFallbackNotice(null), []);

    const clearResult = useCallback(() => {
        setResult(null);
        setEntryId(undefined);
        setError('');
    }, []);

    // Skeleton until something can be shown, then (for translations) the text streams in.
    const isLoading = isBusy && !hasContent(result);

    return {
        sourceText,
        setSourceText,
        result,
        entryId,
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
