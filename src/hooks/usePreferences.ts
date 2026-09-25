import { TranslationMode } from '@/lib/types';
import { AUTO_MODEL, isKnownModel } from '@/lib/models';
import { useStoredValue } from '@/lib/storage';

const MODES: string[] = ['meaning', 'direct', 'reverse'];
const isMode = (v: string) => MODES.includes(v);
// Models saved by older versions (Groq, Gemma, ...) no longer exist; they fall back to auto.
const isModel = (v: string) => v === AUTO_MODEL || isKnownModel(v);

export function usePreferences() {
    const [mode, setMode] = useStoredValue<TranslationMode>('lumen_translation_mode', 'meaning', isMode);
    const [meaningModel, setMeaningModel] = useStoredValue<string>('lumen_meaning_model', AUTO_MODEL, isModel);
    const [directModel, setDirectModel] = useStoredValue<string>('lumen_direct_model', AUTO_MODEL, isModel);
    const [reverseModel, setReverseModel] = useStoredValue<string>('lumen_reverse_model', AUTO_MODEL, isModel);
    const [sourceLang, setSourceLang] = useStoredValue<string>('lumen_source_lang', 'auto');
    const [targetLang, setTargetLang] = useStoredValue<string>('lumen_target_lang', 'uz');

    return {
        mode,
        setMode,
        meaningModel,
        setMeaningModel,
        directModel,
        setDirectModel,
        reverseModel,
        setReverseModel,
        sourceLang,
        setSourceLang,
        targetLang,
        setTargetLang,
    };
}
