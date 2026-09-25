import { useCallback } from 'react';
import { TranslationMode } from '@/lib/types';
import { AUTO_MODEL, isKnownModel } from '@/lib/models';
import { useStoredValue } from '@/lib/storage';
import { MODE_IDS } from '@/lib/modes';

const isMode = (v: string) => (MODE_IDS as string[]).includes(v);
// Models saved by older versions (Groq, Gemma, ...) no longer exist; they fall back to auto.
const isModel = (v: string) => v === AUTO_MODEL || isKnownModel(v);

export interface TranslationSettings {
    mode: TranslationMode;
    sourceLang: string;
    targetLang: string;
}

export function usePreferences() {
    const [mode, storeMode] = useStoredValue<TranslationMode>('lumen_mode', 'auto', isMode);
    // One model for every mode.
    const [model, setModel] = useStoredValue<string>('lumen_model', AUTO_MODEL, isModel);
    const [baseSourceLang, setBaseSourceLang] = useStoredValue<string>('lumen_source_lang', 'auto');
    // Find a word has its own source language: descriptions can be written in any
    // language, so it starts on Auto Detect each time the mode is picked.
    const [findSourceLang, setFindSourceLang] = useStoredValue<string>('lumen_find_source_lang', 'auto');
    const [targetLang, setTargetLang] = useStoredValue<string>('lumen_target_lang', 'uz');

    const sourceLang = mode === 'find' ? findSourceLang : baseSourceLang;

    const setSourceLang = useCallback((lang: string) => {
        (mode === 'find' ? setFindSourceLang : setBaseSourceLang)(lang);
    }, [mode, setFindSourceLang, setBaseSourceLang]);

    const setMode = useCallback((next: TranslationMode) => {
        if (next === 'find' && mode !== 'find') setFindSourceLang('auto');
        storeMode(next);
    }, [mode, storeMode, setFindSourceLang]);

    /** Restores the exact settings of a history entry. */
    const applySettings = useCallback((settings: TranslationSettings) => {
        storeMode(settings.mode);
        (settings.mode === 'find' ? setFindSourceLang : setBaseSourceLang)(settings.sourceLang);
        setTargetLang(settings.targetLang);
    }, [storeMode, setFindSourceLang, setBaseSourceLang, setTargetLang]);

    return {
        mode,
        setMode,
        model,
        setModel,
        sourceLang,
        setSourceLang,
        targetLang,
        setTargetLang,
        applySettings,
    };
}
