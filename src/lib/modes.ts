import { OutputMode, TranslationMode } from './types';

export interface ModeInfo {
    id: TranslationMode;
    label: string;
    description: string;
    placeholder: string;
}

// Up to this many words counts as a word/phrase lookup in Auto mode.
export const AUTO_DICTIONARY_MAX_WORDS = 5;

export const MODES: ModeInfo[] = [
    {
        id: 'auto',
        label: 'Auto',
        description: `Dictionary for up to ${AUTO_DICTIONARY_MAX_WORDS} words, Translate for longer text`,
        placeholder: 'Enter a word or text…',
    },
    {
        id: 'dictionary',
        label: 'Dictionary',
        description: 'Meanings, examples and pronunciation',
        placeholder: 'Enter a word or phrase…',
    },
    {
        id: 'translate',
        label: 'Translate',
        description: 'Natural translation of sentences and text',
        placeholder: 'Enter text to translate…',
    },
    {
        id: 'find',
        label: 'Find a word',
        description: 'Describe something, get the word for it',
        placeholder: 'Describe the word you’re looking for…',
    },
];

export const MODE_IDS = MODES.map((m) => m.id);

export function getModeInfo(id: TranslationMode): ModeInfo {
    return MODES.find((m) => m.id === id) ?? MODES[0];
}

// Scripts written without spaces between words.
const UNSPACED_SCRIPT = /[぀-ヿ㐀-鿿가-힯฀-๿]/g;

function countWords(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    const spaced = trimmed.split(/\s+/).length;
    // For CJK/Thai, roughly two characters per word.
    const unspacedChars = (trimmed.match(UNSPACED_SCRIPT) || []).length;
    return Math.max(spaced, Math.ceil(unspacedChars / 2));
}

export function resolveMode(mode: TranslationMode, text: string): OutputMode {
    if (mode !== 'auto') return mode;
    return countWords(text) <= AUTO_DICTIONARY_MAX_WORDS ? 'dictionary' : 'translate';
}
