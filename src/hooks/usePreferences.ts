import { TranslationMode } from '@/lib/types';
import { AUTO_MODEL, isKnownModel } from '@/lib/models';
import { useStoredValue } from '@/lib/storage';
import { MODE_IDS } from '@/lib/modes';

const isMode = (v: string) => (MODE_IDS as string[]).includes(v);
// Models saved by older versions (Groq, Gemma, ...) no longer exist; they fall back to auto.
const isModel = (v: string) => v === AUTO_MODEL || isKnownModel(v);

export function usePreferences() {
    const [mode, setMode] = useStoredValue<TranslationMode>('lumen_mode', 'auto', isMode);
    // One model for every mode.
    const [model, setModel] = useStoredValue<string>('lumen_model', AUTO_MODEL, isModel);
    const [sourceLang, setSourceLang] = useStoredValue<string>('lumen_source_lang', 'auto');
    const [targetLang, setTargetLang] = useStoredValue<string>('lumen_target_lang', 'uz');

    return {
        mode,
        setMode,
        model,
        setModel,
        sourceLang,
        setSourceLang,
        targetLang,
        setTargetLang,
    };
}
