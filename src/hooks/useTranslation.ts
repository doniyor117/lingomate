import { useState, useCallback, useRef, useEffect } from 'react';
import { saveTranslation } from '@/lib/history';
import { OutputMode, TranslationEntry, TranslationMode } from '@/lib/types';

interface UseTranslationParams {
    sourceLang: string;
    targetLang: string;
    context: string;
    translationMode: TranslationMode;
    meaningModel: string;
    directModel: string;
    reverseModel: string;
    initialEntry?: TranslationEntry | null;
}

export function useTranslation({
    sourceLang,
    targetLang,
    context,
    translationMode,
    meaningModel,
    directModel,
    reverseModel,
    initialEntry
}: UseTranslationParams) {
    const [sourceText, setSourceText] = useState(initialEntry?.sourceText ?? '');
    const [translatedText, setTranslatedText] = useState(initialEntry?.translatedText ?? '');
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState('');
    const [outputMode, setOutputMode] = useState<OutputMode>(translationMode);
    const abortRef = useRef<AbortController | null>(null);

    const cancelTranslation = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
    }, []);

    useEffect(() => cancelTranslation, [cancelTranslation]);

    const handleTranslate = useCallback(async () => {
        const text = sourceText.trim();
        if (!text) return;

        // A new request supersedes whatever is still streaming.
        cancelTranslation();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsBusy(true);
        setError('');
        setTranslatedText('');
        setOutputMode(translationMode);

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    text,
                    sourceLang,
                    targetLang,
                    context: context.trim() || undefined,
                    mode: translationMode,
                    model: translationMode === 'direct' ? directModel : translationMode === 'reverse' ? reverseModel : meaningModel
                }),
            });

            if (!response.ok || !response.body) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Translation failed');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let result = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                result += decoder.decode(value, { stream: true });
                setTranslatedText(result);
            }
            result += decoder.decode();
            setTranslatedText(result);

            saveTranslation({
                sourceText: text,
                translatedText: result,
                sourceLang,
                targetLang,
                context: context.trim() || undefined,
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
    }, [
        sourceText, sourceLang, targetLang, context,
        translationMode, directModel, meaningModel, reverseModel, cancelTranslation
    ]);

    // Skeleton until the first chunk lands, then the text streams in.
    const isLoading = isBusy && !translatedText;
    const isStreaming = isBusy && !!translatedText;

    return {
        sourceText,
        setSourceText,
        translatedText,
        setTranslatedText,
        isLoading,
        isStreaming,
        error,
        setError,
        outputMode,
        setOutputMode,
        handleTranslate,
        cancelTranslation
    };
}
