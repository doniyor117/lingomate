import { GOOGLE_MODELS, GROQ_MODELS, getModelProvider } from './models';
import { buildMeaningPrompt, buildDirectPrompt, buildReverseLookupPrompt, PromptResult } from './prompts';
import { OutputMode, TranslateRequest, TranslateResponse } from './types';

// API endpoints
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Groq only accepts reasoning_effort "none" for Qwen; GPT-OSS accepts low/medium/high
// and rejects "none" with a 400, which used to silently burn a fallback round trip.
const REASONING_EFFORT: Record<string, string> = {
    'qwen/qwen3-32b': 'none',
    'openai/gpt-oss-120b': 'low',
    'openai/gpt-oss-20b': 'low',
};

// A hung upstream would otherwise block the whole fallback chain indefinitely.
const REQUEST_TIMEOUT_MS = 20000;

/**
 * Custom error class for rate limiting
 */
class RateLimitError extends Error {
    constructor(model: string, status: number, message: string) {
        super(`Rate limit hit for ${model}: ${status} - ${message}`);
        this.name = 'RateLimitError';
    }
}

/**
 * Translate with Groq API
 */
async function translateWithGroq(
    model: string,
    prompt: PromptResult,
    apiKey: string
): Promise<string> {
    const body: any = {
        model,
        messages: [
            { role: 'system', content: prompt.systemInstruction },
            { role: 'user', content: prompt.userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
    };

    const reasoningEffort = REASONING_EFFORT[model];
    if (reasoningEffort) {
        body.reasoning_effort = reasoningEffort;
        if (reasoningEffort !== 'none') body.include_reasoning = false;
    }

    const response = await fetch(GROQ_URL, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429 || response.status === 503 || response.status === 529) {
            throw new RateLimitError(model, response.status, errorText);
        }
        throw new Error(`Groq ${model} failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

/**
 * Translate with Gemini API
 */
async function translateWithGemini(
    model: string,
    prompt: PromptResult,
    apiKey: string
): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: prompt.systemInstruction }]
            },
            contents: [{ parts: [{ text: prompt.userPrompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2000,
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429 || response.status === 503) {
            throw new RateLimitError(model, response.status, errorText);
        }
        throw new Error(`Gemini ${model} failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Main translation function
 */
export async function translate(
    request: TranslateRequest,
    groqApiKey?: string,
    geminiApiKey?: string
): Promise<TranslateResponse> {
    const execMode: OutputMode = (request.mode as OutputMode) || 'meaning';

    const promptParams = {
        text: request.text,
        sourceLang: request.sourceLang,
        targetLang: request.targetLang,
        context: request.context,
    };

    let prompt: PromptResult;
    if (execMode === 'reverse') {
        prompt = buildReverseLookupPrompt(promptParams);
    } else if (execMode === 'direct') {
        prompt = buildDirectPrompt(promptParams);
    } else {
        prompt = buildMeaningPrompt(promptParams);
    }

    // Determine the list of models to try
    let modelsToTry: string[] = [];
    const preferredModel = request.model && request.model !== 'auto' ? request.model : null;

    const TOP_5_MODELS = [
        'gemini-3.1-flash-lite',
        'openai/gpt-oss-120b',
        'llama-3.3-70b-versatile',
        'qwen/qwen3-32b',
        'gemma-4-31b-it'
    ];

    if (preferredModel) {
        const provider = getModelProvider(preferredModel);
        if (provider === 'google') {
            modelsToTry = [preferredModel, ...GOOGLE_MODELS.map(m => m.id).filter(id => id !== preferredModel)];
        } else if (provider === 'groq') {
            modelsToTry = [preferredModel, ...GROQ_MODELS.map(m => m.id).filter(id => id !== preferredModel)];
        }
    } else {
        // Auto model selection uses the unified Top 5 ranking
        modelsToTry = [...TOP_5_MODELS];
    }

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
        const provider = getModelProvider(model);

        if (provider === 'google') {
            if (!geminiApiKey) {
                lastError = new Error(`GEMINI_API_KEY is not configured for model ${model}`);
                continue;
            }
            try {
                const translation = await translateWithGemini(model, prompt, geminiApiKey);
                if (!translation) throw new Error("Empty response from API");
                return {
                    translation,
                    model,
                    mode: execMode,
                };
            } catch (error) {
                console.warn(`Gemini model ${model} failed, trying next fallback:`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
            }
        } else {
            if (!groqApiKey) {
                lastError = new Error(`GROQ_API_KEY is not configured for model ${model}`);
                continue;
            }
            try {
                const translation = await translateWithGroq(model, prompt, groqApiKey);
                if (!translation) throw new Error("Empty response from API");
                return {
                    translation,
                    model,
                    mode: execMode,
                };
            } catch (error) {
                console.warn(`Groq model ${model} failed, trying next fallback:`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
            }
        }
    }

    throw lastError || new Error('All models failed to translate');
}
