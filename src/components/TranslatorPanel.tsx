'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Draft, writeDraft } from '@/lib/draft';
import { TranslationEntry, TranslationMode } from '@/lib/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useSpeech } from '@/hooks/useSpeech';
import { getDetectedLanguage, toSpeechText, toSwapText } from '@/lib/results';
import { SourcePanel } from './SourcePanel';
import { TargetPanel } from './TargetPanel';
import { LanguageSelect } from './LanguageSelect';
import { FallbackToast } from './FallbackToast';
import { useCanSpeak } from '@/lib/voices';

interface TranslatorPanelProps {
    /** Entry restored from history; the parent remounts the panel (via key) when it changes. */
    initialEntry: TranslationEntry | null;
    /** Unsent input restored after a reload. */
    initialDraft?: Draft | null;
    mode: TranslationMode;
    onModeChange: (mode: TranslationMode) => void;
    model: string;
    sourceLang: string;
    targetLang: string;
    onSourceLangChange: (lang: string) => void;
    onTargetLangChange: (lang: string) => void;
}

export function TranslatorPanel({
    initialEntry,
    initialDraft,
    mode,
    onModeChange,
    model,
    sourceLang,
    targetLang,
    onSourceLangChange,
    onTargetLangChange
}: TranslatorPanelProps) {
    const [context, setContext] = useState(initialDraft?.context ?? initialEntry?.context ?? '');
    const [showContext, setShowContext] = useState(!!(initialDraft?.context ?? initialEntry?.context));

    const {
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
    } = useTranslation({
        sourceLang,
        targetLang,
        context,
        mode,
        model,
        initialEntry,
        initialText: initialDraft?.sourceText
    });

    // Save the input as it changes. Skips the unchanged initial state, so mounting
    // an empty panel never wipes a draft the page is about to restore.
    const savedDraft = useRef(JSON.stringify([sourceText, context, entryId]));
    useEffect(() => {
        const current = JSON.stringify([sourceText, context, entryId]);
        if (current === savedDraft.current) return;
        savedDraft.current = current;
        writeDraft({ sourceText, context, entryId });
    }, [sourceText, context, entryId]);

    const detectedLanguage = getDetectedLanguage(result);
    const canSpeak = useCanSpeak();
    // With Auto Detect the input's language is only known once a result detected it.
    const sourceSpeechLang = sourceLang !== 'auto' ? sourceLang : detectedLanguage;

    const {
        isListening,
        isSpeakingSource,
        isSpeakingTarget,
        speakingKey,
        speakItem,
        toggleListening,
        handleSpeakSource,
        handleSpeakTarget
    } = useSpeech({
        sourceLang,
        sourceSpeechLang: sourceSpeechLang ?? 'en',
        targetLang,
        setSourceText,
        targetSpeechText: result ? toSpeechText(result) : '',
    });

    const handleSwapLanguages = () => {
        // With auto-detect, the detected language becomes the new target.
        const newTarget = sourceLang === 'auto' ? detectedLanguage ?? 'en' : sourceLang;
        onSourceLangChange(targetLang);
        onTargetLangChange(newTarget);
        cancelTranslation();
        if (result) setSourceText(toSwapText(result));
        clearResult();
    };

    const handleClear = () => {
        cancelTranslation();
        setSourceText('');
        clearResult();
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
            <LanguageSelect
                sourceLang={sourceLang}
                targetLang={targetLang}
                setSourceLang={onSourceLangChange}
                setTargetLang={onTargetLangChange}
                handleSwapLanguages={handleSwapLanguages}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 min-h-[400px]">
                <SourcePanel
                    sourceText={sourceText}
                    setSourceText={setSourceText}
                    context={context}
                    setContext={setContext}
                    showContext={showContext}
                    setShowContext={setShowContext}
                    mode={mode}
                    onModeChange={onModeChange}
                    handleTranslate={handleTranslate}
                    onCancel={cancelTranslation}
                    isBusy={isBusy}
                    isListening={isListening}
                    toggleListening={toggleListening}
                    isSpeakingSource={isSpeakingSource}
                    canSpeakSource={!!sourceSpeechLang && canSpeak(sourceSpeechLang)}
                    handleSpeakSource={handleSpeakSource}
                    handleClear={handleClear}
                />

                <TargetPanel
                    result={result}
                    detectedLanguage={sourceLang === 'auto' ? detectedLanguage : undefined}
                    sourceLang={sourceLang === 'auto' ? detectedLanguage ?? 'auto' : sourceLang}
                    targetLang={targetLang}
                    error={error}
                    isLoading={isLoading}
                    isStreaming={isBusy && !isLoading}
                    isSpeakingTarget={isSpeakingTarget}
                    handleSpeakTarget={handleSpeakTarget}
                    speech={{ speakingKey, speakItem, sourceLang: sourceSpeechLang ?? 'en', targetLang, canSpeak }}
                />
            </div>

            <FallbackToast notice={fallbackNotice} onClose={dismissFallbackNotice} />
        </div>
    );
}
