import { OutputMode, TranslationMode } from './types';
import type { MessageKey } from './i18n';

// Up to this many words counts as a word/phrase lookup in Auto mode.
export const AUTO_DICTIONARY_MAX_WORDS = 5;

export const MODE_IDS: TranslationMode[] = ['auto', 'dictionary', 'translate', 'find'];

/** Translation keys for a mode's label, description and input placeholder. */
export function modeKey(mode: TranslationMode, field: 'label' | 'desc' | 'placeholder'): MessageKey {
    return `mode.${mode}.${field}` as MessageKey;
}

// Scripts written without spaces between words.
const UNSPACED_SCRIPT = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0e00-\u0e7f]/g;

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
