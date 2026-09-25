import { useState, useEffect } from 'react';
import { TranslationMode } from '@/lib/types';

export function usePreferences() {
    const [mode, setMode] = useState<TranslationMode>('meaning');
    const [meaningModel, setMeaningModel] = useState('auto');
    const [directModel, setDirectModel] = useState('auto');
    const [reverseModel, setReverseModel] = useState('auto');
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('uz');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedMode = localStorage.getItem('lumen_translation_mode') as TranslationMode;
            if (savedMode && ['meaning', 'direct', 'reverse'].includes(savedMode)) {
                setMode(savedMode);
            }
            
            const savedMeaning = localStorage.getItem('lumen_meaning_model');
            if (savedMeaning) setMeaningModel(savedMeaning);
            
            const savedDirect = localStorage.getItem('lumen_direct_model');
            if (savedDirect) setDirectModel(savedDirect);

            const savedReverse = localStorage.getItem('lumen_reverse_model');
            if (savedReverse) setReverseModel(savedReverse);

            const savedSource = localStorage.getItem('lumen_source_lang');
            if (savedSource) setSourceLang(savedSource);

            const savedTarget = localStorage.getItem('lumen_target_lang');
            if (savedTarget) setTargetLang(savedTarget);

            setIsLoaded(true);
        }
    }, []);

    const handleSetMode = (newMode: TranslationMode) => {
        setMode(newMode);
        localStorage.setItem('lumen_translation_mode', newMode);
    };

    const handleSetMeaningModel = (model: string) => {
        setMeaningModel(model);
        localStorage.setItem('lumen_meaning_model', model);
    };

    const handleSetDirectModel = (model: string) => {
        setDirectModel(model);
        localStorage.setItem('lumen_direct_model', model);
    };

    const handleSetReverseModel = (model: string) => {
        setReverseModel(model);
        localStorage.setItem('lumen_reverse_model', model);
    };

    const handleSetSourceLang = (lang: string) => {
        setSourceLang(lang);
        localStorage.setItem('lumen_source_lang', lang);
    };

    const handleSetTargetLang = (lang: string) => {
        setTargetLang(lang);
        localStorage.setItem('lumen_target_lang', lang);
    };

    return {
        isLoaded,
        mode,
        setMode: handleSetMode,
        meaningModel,
        setMeaningModel: handleSetMeaningModel,
        directModel,
        setDirectModel: handleSetDirectModel,
        reverseModel,
        setReverseModel: handleSetReverseModel,
        sourceLang,
        setSourceLang: handleSetSourceLang,
        targetLang,
        setTargetLang: handleSetTargetLang,
    };
}
