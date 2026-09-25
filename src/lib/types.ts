/** What the user picks; "auto" resolves to dictionary or translate per request. */
export type TranslationMode = 'auto' | 'dictionary' | 'translate' | 'find';
/** The mode a request actually runs in. */
export type OutputMode = Exclude<TranslationMode, 'auto'>;

export interface TranslateRequest {
    text: string;
    sourceLang: string;
    targetLang: string;
    context?: string;
    mode: OutputMode;
    model?: string;
}

export type Register = 'standard' | 'formal' | 'informal' | 'slang' | 'internet' | 'vulgar';

export interface DictionarySense {
    emoji: string;
    translation: string;
    partOfSpeech: string;
    register: Register;
    explanation: string;
    example: string;
    exampleTranslation: string;
}

export interface DictionaryResult {
    detectedLanguage: string;
    headword: string;
    pronunciation: string;
    senses: DictionarySense[];
    note: string;
}

export interface FindCandidate {
    word: string;
    partOfSpeech: string;
    register: Register;
    meaning: string;
    whyItFits: string;
    example: string;
}

export interface FindResult {
    detectedLanguage: string;
    candidates: FindCandidate[];
    note: string;
}

export type TranslationResult =
    | { mode: 'translate'; text: string; detectedLanguage?: string }
    | { mode: 'dictionary'; data: DictionaryResult }
    | { mode: 'find'; data: FindResult }
    /** Markdown output saved in history by older versions. */
    | { mode: 'legacy'; text: string };

export interface TranslationEntry {
    id: string;
    timestamp: number;
    sourceText: string;
    /** Plain translation, or the JSON result for dictionary / find entries. */
    translatedText: string;
    /** Mode the result was produced in. Missing on entries saved by older versions (markdown output). */
    mode?: OutputMode;
    /** Mode that was selected in the picker (may be "auto"); restored with the entry. */
    selectedMode?: TranslationMode;
    detectedLanguage?: string;
    sourceLang: string;
    targetLang: string;
    context?: string;
}
