export type TranslationMode = 'meaning' | 'direct' | 'reverse';
export type OutputMode = 'meaning' | 'direct' | 'reverse';

export interface TranslateRequest {
    text: string;
    sourceLang: string;
    targetLang: string;
    context?: string;
    mode?: TranslationMode;
    model?: string;
}

export interface TranslationEntry {
    id: string;
    timestamp: number;
    sourceText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    context?: string;
}
