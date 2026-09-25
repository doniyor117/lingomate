'use client';

import React, { useState } from 'react';
import { TranslationEntry, TranslationMode } from '@/lib/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useSpeech } from '@/hooks/useSpeech';
import { SourcePanel } from './SourcePanel';
import { TargetPanel } from './TargetPanel';
import { LanguageSelect } from './LanguageSelect';
import { FallbackToast } from './FallbackToast';

interface TranslatorPanelProps {
    /** Entry restored from history; the parent remounts the panel (via key) when it changes. */
    initialEntry: TranslationEntry | null;
    translationMode: TranslationMode;
    model: string;
    sourceLang: string;
    targetLang: string;
    onSourceLangChange: (lang: string) => void;
    onTargetLangChange: (lang: string) => void;
}

export function TranslatorPanel({
    initialEntry,
    translationMode,
    model,
    sourceLang,
    targetLang,
    onSourceLangChange,
    onTargetLangChange
}: TranslatorPanelProps) {
    const [context, setContext] = useState(initialEntry?.context ?? '');
    const [showContext, setShowContext] = useState(!!initialEntry?.context);

    const {
        sourceText,
        setSourceText,
        translatedText,
        setTranslatedText,
        isLoading,
        isStreaming,
        error,
        setError,
        outputMode,
        handleTranslate,
        cancelTranslation,
        fallbackNotice,
        dismissFallbackNotice
    } = useTranslation({
        sourceLang,
        targetLang,
        context,
        translationMode,
        model,
        initialEntry
    });

    const {
        isListening,
        isSpeakingSource,
        isSpeakingTarget,
        toggleListening,
        handleSpeakSource,
        handleSpeakTarget
    } = useSpeech({
        sourceLang,
        targetLang,
        setSourceText,
        translatedText,
        outputMode
    });

    const handleSwapLanguages = () => {
        if (sourceLang === 'auto') {
            onSourceLangChange(targetLang);
            onTargetLangChange('en');
        } else {
            const temp = sourceLang;
            onSourceLangChange(targetLang);
            onTargetLangChange(temp);
        }
        cancelTranslation();
        setSourceText(translatedText.replace(/\*/g, '').replace(/\[.*?\]/g, '').trim());
        setTranslatedText('');
        setError('');
    };

    const handleClear = () => {
        cancelTranslation();
        setSourceText('');
        setTranslatedText('');
        setError('');
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
                    handleTranslate={handleTranslate}
                    isLoading={isLoading || isStreaming}
                    isListening={isListening}
                    toggleListening={toggleListening}
                    isSpeakingSource={isSpeakingSource}
                    handleSpeakSource={handleSpeakSource}
                    handleClear={handleClear}
                />

                <TargetPanel
                    translatedText={translatedText}
                    error={error}
                    isLoading={isLoading}
                    outputMode={translatedText || isLoading ? outputMode : translationMode}
                    isSpeakingTarget={isSpeakingTarget}
                    handleSpeakTarget={handleSpeakTarget}
                />
            </div>

            <FallbackToast notice={fallbackNotice} onClose={dismissFallbackNotice} />
        </div>
    );
}
