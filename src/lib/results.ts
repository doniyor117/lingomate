import { LANG_TAG_EXAMPLE } from './prompts';
import {
    DictionaryResult,
    FindResult,
    OutputMode,
    Register,
    TranslationEntry,
    TranslationResult,
} from './types';

const LANG_TAG = /^\s*\[\[lang:\s*([a-zA-Z-]{2,10})\s*\]\]\s*/;
// A stream that may still turn into a full language tag.
const PARTIAL_LANG_TAG = new RegExp(`^\\s*\\[(\\[[^\\]\\n]{0,${LANG_TAG_EXAMPLE.length}}\\]?)?$`);

/** Splits the optional [[lang:xx]] prefix off streamed translate output. */
export function parseTranslateOutput(raw: string, expectTag: boolean): TranslationResult {
    if (expectTag) {
        const match = raw.match(LANG_TAG);
        if (match) {
            return { mode: 'translate', text: raw.slice(match[0].length), detectedLanguage: match[1].toLowerCase() };
        }
        if (PARTIAL_LANG_TAG.test(raw)) return { mode: 'translate', text: '' };
    }
    return { mode: 'translate', text: raw };
}

const REGISTERS: Register[] = ['standard', 'formal', 'informal', 'slang', 'internet', 'vulgar'];

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const register = (v: unknown): Register => (REGISTERS.includes(v as Register) ? (v as Register) : 'standard');

function parseJson(raw: string): Record<string, unknown> {
    // Tolerate a ```json fence in case the model ignores the JSON mime type.
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== 'object') throw new Error('Unexpected response');
    return parsed;
}

function toDictionary(json: Record<string, unknown>): DictionaryResult {
    const senses = Array.isArray(json.senses) ? json.senses : [];
    return {
        detectedLanguage: str(json.detectedLanguage).toLowerCase(),
        headword: str(json.headword),
        pronunciation: str(json.pronunciation),
        note: str(json.note),
        senses: senses
            .map((s) => ({
                emoji: str(s?.emoji),
                translation: str(s?.translation),
                partOfSpeech: str(s?.partOfSpeech),
                register: register(s?.register),
                explanation: str(s?.explanation),
                example: str(s?.example),
                exampleTranslation: str(s?.exampleTranslation),
            }))
            .filter((s) => s.translation),
    };
}

function toFind(json: Record<string, unknown>): FindResult {
    const candidates = Array.isArray(json.candidates) ? json.candidates : [];
    return {
        detectedLanguage: str(json.detectedLanguage).toLowerCase(),
        note: str(json.note),
        candidates: candidates
            .map((c) => ({
                word: str(c?.word),
                partOfSpeech: str(c?.partOfSpeech),
                register: register(c?.register),
                meaning: str(c?.meaning),
                whyItFits: str(c?.whyItFits),
                example: str(c?.example),
            }))
            .filter((c) => c.word),
    };
}

/** Parses a finished response; throws if a structured response is unusable. */
export function parseOutput(mode: OutputMode, raw: string, expectTag: boolean): TranslationResult {
    if (mode === 'translate') return parseTranslateOutput(raw, expectTag);
    if (mode === 'dictionary') {
        const data = toDictionary(parseJson(raw));
        if (!data.senses.length) throw new Error('No meanings found');
        return { mode, data };
    }
    const data = toFind(parseJson(raw));
    if (!data.candidates.length) throw new Error('No matching words found');
    return { mode, data };
}

export function hasContent(result: TranslationResult | null): boolean {
    if (!result) return false;
    return result.mode === 'translate' || result.mode === 'legacy' ? !!result.text.trim() : true;
}

export function getDetectedLanguage(result: TranslationResult | null): string | undefined {
    if (!result || result.mode === 'legacy') return undefined;
    const code = result.mode === 'translate' ? result.detectedLanguage : result.data.detectedLanguage;
    return code || undefined;
}

// Strips markdown from legacy (pre-structured) output.
const stripMarkdown = (text: string) => text.replace(/\*\*?|__|`/g, '').replace(/^#+\s*/gm, '').trim();

/** Readable plain text for the clipboard. */
export function toCopyText(result: TranslationResult): string {
    switch (result.mode) {
        case 'translate':
            return result.text.trim();
        case 'legacy':
            return stripMarkdown(result.text);
        case 'dictionary': {
            const { headword, pronunciation, senses, note } = result.data;
            const lines = [`${headword}${pronunciation ? ` ${pronunciation}` : ''}`, ''];
            senses.forEach((s, i) => {
                lines.push(`${i + 1}. ${s.translation}${s.partOfSpeech ? ` (${s.partOfSpeech})` : ''}`);
                if (s.explanation) lines.push(`   ${s.explanation}`);
                if (s.example) lines.push(`   ${s.example}${s.exampleTranslation ? ` — ${s.exampleTranslation}` : ''}`);
            });
            if (note) lines.push('', note);
            return lines.join('\n');
        }
        case 'find': {
            const { candidates, note } = result.data;
            const lines = candidates.map((c, i) =>
                `${i + 1}. ${c.word}${c.partOfSpeech ? ` (${c.partOfSpeech})` : ''} — ${c.meaning}`);
            if (note) lines.push('', note);
            return lines.join('\n');
        }
    }
}

/** What "Listen" reads aloud: only the target-language words. */
export function toSpeechText(result: TranslationResult): string {
    switch (result.mode) {
        case 'translate':
            return result.text.trim();
        case 'legacy':
            return stripMarkdown(result.text);
        case 'dictionary':
            return result.data.senses.map((s) => s.translation).join(', ');
        case 'find':
            return result.data.candidates.map((c) => c.word).join(', ');
    }
}

/** Text to put in the input box when swapping languages. */
export function toSwapText(result: TranslationResult): string {
    switch (result.mode) {
        case 'translate':
            return result.text.trim();
        case 'legacy':
            return stripMarkdown(result.text).split('\n')[0] ?? '';
        case 'dictionary':
            return result.data.senses[0]?.translation ?? '';
        case 'find':
            return result.data.candidates[0]?.word ?? '';
    }
}

/** Short one-line summary for the history list. */
export function toPreview(result: TranslationResult): string {
    return toSpeechText(result).replace(/\s+/g, ' ').slice(0, 80);
}

/** What gets stored in history for a result. */
export function serializeResult(result: TranslationResult): Pick<TranslationEntry, 'translatedText' | 'mode' | 'detectedLanguage'> {
    switch (result.mode) {
        case 'translate':
            return { translatedText: result.text, mode: 'translate', detectedLanguage: result.detectedLanguage };
        case 'dictionary':
        case 'find':
            return { translatedText: JSON.stringify(result.data), mode: result.mode, detectedLanguage: result.data.detectedLanguage };
        case 'legacy':
            return { translatedText: result.text };
    }
}

export function entryToResult(entry: TranslationEntry): TranslationResult {
    if (entry.mode === 'translate') {
        return { mode: 'translate', text: entry.translatedText, detectedLanguage: entry.detectedLanguage };
    }
    if (entry.mode === 'dictionary' || entry.mode === 'find') {
        try {
            return parseOutput(entry.mode, entry.translatedText, false);
        } catch {
            // Fall through to showing it as text.
        }
    }
    return { mode: 'legacy', text: entry.translatedText };
}
