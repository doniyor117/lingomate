import { getLanguageByCode } from './languages';

export interface PromptParams {
    text: string;
    sourceLang: string;
    targetLang: string;
    context?: string;
}

export interface PromptResult {
    systemInstruction: string;
    userPrompt: string;
}

export function buildMeaningPrompt({ text, sourceLang, targetLang, context }: PromptParams): PromptResult {
    const target = getLanguageByCode(targetLang);
    const targetName = target ? target.name : targetLang;
    const targetFlag = target ? target.flag : '🌐';
    
    const source = getLanguageByCode(sourceLang);
    const sourceName = source ? source.name : sourceLang;
    const isAuto = sourceLang === 'auto';

    const systemInstruction = `You are an expert linguist translator. Translate a word/phrase to ${targetName}.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS (use markdown for bolding and lists):
${isAuto ? '\n**Detected Language:** [Full Language Name] [flag emoji]' : ''}

**[Corrected Word if typo, or Original Word]** [pronunciation]

1. [visual emoji] **[Translation in ${targetName}]** [*part of speech like noun, verb, adj., etc.*]
   [One line explanation in ${targetName} about when/how to use this meaning]
   *Example:* [A short example sentence in detected language using the original word]

2. [visual emoji] **[Alternative Translation]** [*part of speech*]
   [One line explanation in ${targetName}]
   *Example:* [Example sentence in detected language]

(continue numbering if more meanings exist)

📝 **Note:** [Any special tips, cultural notes, or grammar tips - write in ${targetName}]

IMPORTANT RULES:
${!isAuto ? `- CRITICAL: The user has EXPLICITLY set the source language to ${sourceName}. You MUST interpret the input as ${sourceName}, even if it looks like another language (e.g. 'Gift' in German = Poison, not Present).` : `- CRITICAL: Identify the language of the input text accurately and write it in the 'Detected Language' line.`}
- Use visual emojis that represent the meaning (🏦 for bank/money, 🌊 for river bank, 👋 for hello, 📚 for book, etc.)
- Put pronunciation in [brackets] right after the word
- Write ALL explanations in ${targetName} language! EXAMPLE LANG IS IN THE LANG OF THE WORD SEARCHED
- If the input has typos like "helo" or "bitte", correct it and show the proper spelling
- Include articles if important (der/die/das for German, etc.) and note them in the note section
- Be concise but informative
- DO NOT echo these rules back to the user. DO NOT output internal thoughts. Output ONLY the final requested format.`;

    const userPrompt = `${context ? `User context: ${context}\n` : ''}Word to translate: "${text}"
Target language: ${targetName} ${targetFlag}`;

    return { systemInstruction, userPrompt };
}

export function buildDirectPrompt({ text, sourceLang, targetLang, context }: PromptParams): PromptResult {
    const target = getLanguageByCode(targetLang);
    const targetName = target ? target.name : targetLang;
    const targetFlag = target ? target.flag : '🌐';
    
    const source = getLanguageByCode(sourceLang);
    const sourceName = source ? source.name : sourceLang;
    const isAuto = sourceLang === 'auto';

    const systemInstruction = `You are an expert translator. Translate text to ${targetName}.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
${isAuto ? '\n**Detected Language:** [Language Name] [flag emoji]' : ''}

[Your accurate, natural translation in ${targetName}]

RULES:
${!isAuto ? `- CRITICAL: The user has EXPLICITLY set the source language to ${sourceName}. Treat the input as ${sourceName}, even if it looks like another language.` : `- CRITICAL: Identify the language of the input text accurately and write it in the 'Detected Language' line.`}
- Provide ONLY the translation${isAuto ? ' after the detected language line' : ''}
- Use natural, native-sounding ${targetName}
- Preserve the original meaning, tone, and style
- NO explanations, NO alternatives, NO notes
- Just the clean translation
- DO NOT echo the prompt, DO NOT output internal thoughts, DO NOT wrap the output in any extra tags. Provide the final text immediately.`;

    const userPrompt = `${context ? `Context: ${context}\n` : ''}Text to translate: "${text}"
Target language: ${targetName} ${targetFlag}`;

    return { systemInstruction, userPrompt };
}

export function buildReverseLookupPrompt({ text, sourceLang, targetLang, context }: PromptParams): PromptResult {
    const target = getLanguageByCode(targetLang);
    const targetName = target ? target.name : targetLang;
    
    const source = getLanguageByCode(sourceLang);
    const sourceName = source ? source.name : sourceLang;
    const isAuto = sourceLang === 'auto';

    const systemInstruction = `You are an expert linguist. The user is trying to remember or find a word based on a description.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
${isAuto ? '\n**Detected Language:** [Language Name] [flag emoji]' : ''}

Here are the best candidates for your description:

1. **[Candidate Word in ${targetName}]** [*part of speech*]
   [Literal translation or core meaning in ${sourceName}]
   *Why it fits:* [Brief explanation in ${sourceName} of why this word matches the description]
   *Example:* [Example sentence in ${targetName}]

2. **[Alternative Word in ${targetName}]** [*part of speech*]
   [Literal translation or core meaning in ${sourceName}]
   *Why it fits:* [Brief explanation in ${sourceName}]
   *Example:* [Example sentence in ${targetName}]

(provide up to 3-5 strong candidates)

📝 **Note:** [Any nuances, common mistakes, or context about these words in ${sourceName}]

IMPORTANT RULES:
- The user's description is written in ${sourceName}.
- Provide the candidate words in ${targetName}.
- All explanations and "Why it fits" must be in ${sourceName}.
- Include gender/articles for the candidate words if applicable (e.g. el agua, la mesa).
- DO NOT echo instructions, DO NOT output internal thoughts. Provide only the candidates.`;

    const userPrompt = `${context ? `Context: ${context}\n` : ''}Description of the word: "${text}"`;

    return { systemInstruction, userPrompt };
}
