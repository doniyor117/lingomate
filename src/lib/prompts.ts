import { getLanguageByCode } from './languages';
import { OutputMode, TranslateRequest } from './types';

export interface PromptResult {
    systemInstruction: string;
    userPrompt: string;
    /** JSON schema for structured modes; translate mode streams plain text. */
    schema?: object;
}

/** Prefix the translate prompt asks for when the source language is auto-detected. */
export const LANG_TAG_EXAMPLE = '[[lang:en]]';

const REGISTERS = ['standard', 'formal', 'informal', 'slang', 'internet', 'vulgar'];

const REGISTER_RULES = `- register: "standard" for ordinary usage; "formal" or "informal" where that matters; "slang" or "internet" for real slang, Gen Z or internet usage (e.g. English "cope", "based", "mid", "ghost"); "vulgar" for offensive usage.
- Include slang, Gen Z or internet meanings only when the word genuinely has them in current use. Never invent or force a slang sense. A minor slang use can go in the note instead of its own sense.`;

function languageName(code: string): string {
    return getLanguageByCode(code)?.name ?? code;
}

function sourceRule(sourceLang: string, subject: string): string {
    if (sourceLang === 'auto') return '';
    const name = languageName(sourceLang);
    return `- The user set the source language to ${name}. Treat the ${subject} as ${name} even if it looks like another language (e.g. German "Gift" means poison, not present).\n`;
}

function contextRule(context?: string): string {
    return context ? `- The user added this context; follow it: "${context}"\n` : '';
}

function dictionaryPrompt({ text, sourceLang, targetLang, context }: TranslateRequest): PromptResult {
    const target = languageName(targetLang);

    const systemInstruction = `You are a bilingual dictionary. Look up the user's word or short phrase and explain it for a ${target} speaker. Reply with JSON matching the schema.

- detectedLanguage: ISO 639-1 code of the input's language.
${sourceRule(sourceLang, 'input')}- headword: the input with any typo corrected (unchanged if already correct). Add the article or gender for nouns in languages that have them (der/die/das, el/la, le/la).
- pronunciation: IPA for the headword, in slashes.
- senses: the distinct meanings, most common first (usually 1-5). If the input is an idiom or phrase, explain the phrase as a whole. For each sense:
  - translation: the ${target} equivalent
  - partOfSpeech: short, written in ${target}
  - explanation: one short sentence in ${target} about when or how it's used
  - example: a short natural sentence in the input's language using the headword in this sense
  - exampleTranslation: that example in ${target}
  - emoji: one emoji that pictures this sense
${REGISTER_RULES}
- note: one short, genuinely useful tip in ${target} (grammar, false friends, cultural nuance, slang usage), or "" if there is nothing worth adding.
${contextRule(context)}`;

    const sense = {
        type: 'object',
        properties: {
            emoji: { type: 'string' },
            translation: { type: 'string' },
            partOfSpeech: { type: 'string' },
            register: { type: 'string', enum: REGISTERS },
            explanation: { type: 'string' },
            example: { type: 'string' },
            exampleTranslation: { type: 'string' },
        },
        required: ['emoji', 'translation', 'partOfSpeech', 'register', 'explanation', 'example', 'exampleTranslation'],
        propertyOrdering: ['emoji', 'translation', 'partOfSpeech', 'register', 'explanation', 'example', 'exampleTranslation'],
    };

    return {
        systemInstruction,
        userPrompt: text,
        schema: {
            type: 'object',
            properties: {
                detectedLanguage: { type: 'string' },
                headword: { type: 'string' },
                pronunciation: { type: 'string' },
                senses: { type: 'array', items: sense, minItems: 1, maxItems: 6 },
                note: { type: 'string' },
            },
            required: ['detectedLanguage', 'headword', 'pronunciation', 'senses', 'note'],
            propertyOrdering: ['detectedLanguage', 'headword', 'pronunciation', 'senses', 'note'],
        },
    };
}

function findPrompt({ text, sourceLang, targetLang, context }: TranslateRequest): PromptResult {
    const target = languageName(targetLang);
    const descriptionLanguage = sourceLang === 'auto'
        ? 'the same language the description is written in'
        : languageName(sourceLang);

    const systemInstruction = `You help people find a word they can't remember. The user describes a word or concept; suggest the ${target} words that best match it. Reply with JSON matching the schema.

- detectedLanguage: ISO 639-1 code of the language the description is written in.
${sourceRule(sourceLang, 'description')}- candidates: 1-5 words, best match first. For each:
  - word: the ${target} word or expression, with its article or gender if ${target} uses them
  - partOfSpeech: short, written in ${descriptionLanguage}
  - meaning: its literal or core meaning, written in ${descriptionLanguage}
  - whyItFits: one short sentence in ${descriptionLanguage} on why it matches the description
  - example: a short natural sentence in ${target} using the word
${REGISTER_RULES}
- note: nuances or common mistakes when choosing between these words, in ${descriptionLanguage}, or "" if nothing is worth adding.
${contextRule(context)}`;

    const candidate = {
        type: 'object',
        properties: {
            word: { type: 'string' },
            partOfSpeech: { type: 'string' },
            register: { type: 'string', enum: REGISTERS },
            meaning: { type: 'string' },
            whyItFits: { type: 'string' },
            example: { type: 'string' },
        },
        required: ['word', 'partOfSpeech', 'register', 'meaning', 'whyItFits', 'example'],
        propertyOrdering: ['word', 'partOfSpeech', 'register', 'meaning', 'whyItFits', 'example'],
    };

    return {
        systemInstruction,
        userPrompt: text,
        schema: {
            type: 'object',
            properties: {
                detectedLanguage: { type: 'string' },
                candidates: { type: 'array', items: candidate, minItems: 1, maxItems: 5 },
                note: { type: 'string' },
            },
            required: ['detectedLanguage', 'candidates', 'note'],
            propertyOrdering: ['detectedLanguage', 'candidates', 'note'],
        },
    };
}

function translatePrompt({ text, sourceLang, targetLang, context }: TranslateRequest): PromptResult {
    const target = languageName(targetLang);
    const isAuto = sourceLang === 'auto';

    const systemInstruction = `You are a professional translator. Translate the user's text into ${target}.

${sourceRule(sourceLang, 'text')}- Write natural, native-sounding ${target}. Keep the meaning, tone and register, and keep the formatting (line breaks, lists).
- Render slang, Gen Z or internet expressions with a natural ${target} equivalent that keeps their tone; don't make casual text formal.
- Output only the translation: no quotes, notes, alternatives or explanations.
${contextRule(context)}${isAuto ? `- Start your output with a language tag like ${LANG_TAG_EXAMPLE}, using the ISO 639-1 code of the source text, then a newline, then the translation.\n` : ''}`;

    return { systemInstruction, userPrompt: text };
}

const BUILDERS: Record<OutputMode, (request: TranslateRequest) => PromptResult> = {
    dictionary: dictionaryPrompt,
    translate: translatePrompt,
    find: findPrompt,
};

export function buildPrompt(request: TranslateRequest): PromptResult {
    return BUILDERS[request.mode](request);
}
