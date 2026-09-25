import { getModelOrder } from './models';
import { buildMeaningPrompt, buildDirectPrompt, buildReverseLookupPrompt, PromptResult } from './prompts';
import { OutputMode, TranslateRequest } from './types';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// If a model hasn't produced its first token by then, move on to the next one.
const FIRST_TOKEN_TIMEOUT_MS = 12000;
// Hard cap for the whole streamed answer once it has started.
const TOTAL_TIMEOUT_MS = 60000;

export interface TranslationStream {
    model: string;
    stream: ReadableStream<Uint8Array>;
}

function buildPrompt(request: TranslateRequest): PromptResult {
    const params = {
        text: request.text,
        sourceLang: request.sourceLang,
        targetLang: request.targetLang,
        context: request.context,
    };
    if (request.mode === 'reverse') return buildReverseLookupPrompt(params);
    if (request.mode === 'direct') return buildDirectPrompt(params);
    return buildMeaningPrompt(params);
}

/**
 * Reads Gemini's SSE stream and yields answer text, skipping thought parts.
 */
async function* readGeminiText(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newline: number;
            while ((newline = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, newline).trim();
                buffer = buffer.slice(newline + 1);
                if (!line.startsWith('data:')) continue;

                const payload = JSON.parse(line.slice(5));
                if (payload.error) {
                    throw new Error(payload.error.message || 'Gemini stream error');
                }
                const parts = payload.candidates?.[0]?.content?.parts ?? [];
                for (const part of parts) {
                    if (part.text && !part.thought) yield part.text;
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}

/**
 * Opens a streaming request to one model and waits for its first token, so a
 * failing, rate-limited or empty model can still fall back to the next one
 * before anything has been sent to the client.
 */
async function openModelStream(model: string, prompt: PromptResult, apiKey: string): Promise<TranslationStream> {
    const controller = new AbortController();
    let timer = setTimeout(() => controller.abort(new Error(`${model} timed out`)), FIRST_TOKEN_TIMEOUT_MS);

    try {
        const response = await fetch(`${GEMINI_BASE_URL}/${model}:streamGenerateContent?alt=sse`, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: prompt.systemInstruction }] },
                contents: [{ role: 'user', parts: [{ text: prompt.userPrompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 2000,
                    // Translation needs no reasoning; minimal thinking keeps time-to-first-token low.
                    thinkingConfig: { thinkingLevel: 'minimal' },
                },
            }),
        });

        if (!response.ok || !response.body) {
            const errorText = await response.text();
            throw new Error(`Gemini ${model} failed: ${response.status} - ${errorText}`);
        }

        const chunks = readGeminiText(response.body);
        let first = await chunks.next();
        while (!first.done && !first.value) first = await chunks.next();
        if (first.done) throw new Error(`Empty response from ${model}`);

        clearTimeout(timer);
        timer = setTimeout(() => controller.abort(new Error(`${model} timed out`)), TOTAL_TIMEOUT_MS);

        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
            async start(streamController) {
                try {
                    streamController.enqueue(encoder.encode(first.value as string));
                    for await (const text of chunks) {
                        streamController.enqueue(encoder.encode(text));
                    }
                    streamController.close();
                } catch (error) {
                    streamController.error(error);
                } finally {
                    clearTimeout(timer);
                }
            },
            cancel() {
                clearTimeout(timer);
                controller.abort();
            },
        });

        return { model, stream };
    } catch (error) {
        clearTimeout(timer);
        controller.abort();
        throw error;
    }
}

/**
 * Streams a translation, trying the requested model first and falling back
 * to the other Flash-Lite model if it fails before producing any output.
 */
export async function translateStream(request: TranslateRequest, apiKey: string): Promise<TranslationStream & { mode: OutputMode }> {
    const prompt = buildPrompt(request);
    const mode: OutputMode = request.mode || 'meaning';
    let lastError: Error | null = null;

    for (const model of getModelOrder(request.model)) {
        try {
            return { ...(await openModelStream(model, prompt, apiKey)), mode };
        } catch (error) {
            console.warn(`Gemini model ${model} failed, trying next fallback:`, error);
            lastError = error instanceof Error ? error : new Error(String(error));
        }
    }

    throw lastError || new Error('All models failed to translate');
}
