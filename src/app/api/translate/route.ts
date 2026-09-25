import { NextRequest, NextResponse } from 'next/server';
import { translateStream } from '@/lib/translate-service';
import { MAX_CHARS } from '@/lib/constants';

const MODES = ['dictionary', 'translate', 'find'];
const MAX_CONTEXT_CHARS = 500;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, sourceLang, targetLang, context, mode, model } = body;

        // Validation
        if (!text || typeof text !== 'string' || !text.trim()) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        if (text.length > MAX_CHARS) {
            return NextResponse.json(
                { error: `Text exceeds maximum length of ${MAX_CHARS} characters` },
                { status: 400 }
            );
        }

        if (!targetLang) {
            return NextResponse.json({ error: 'Target language is required' }, { status: 400 });
        }

        if (context !== undefined && (typeof context !== 'string' || context.length > MAX_CONTEXT_CHARS)) {
            return NextResponse.json(
                { error: `Context must be at most ${MAX_CONTEXT_CHARS} characters` },
                { status: 400 }
            );
        }

        if (!MODES.includes(mode)) {
            return NextResponse.json(
                { error: 'Invalid mode. Must be dictionary, translate, or find' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY is not configured' },
                { status: 500 }
            );
        }

        const result = await translateStream(
            {
                text: text.trim(),
                sourceLang: sourceLang || 'auto',
                targetLang,
                context,
                mode,
                model,
            },
            apiKey
        );

        return new Response(result.stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-store',
                'X-Accel-Buffering': 'no',
                'X-Model': result.model,
            },
        });
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { error: 'Translation failed. Please try again.' },
            { status: 502 }
        );
    }
}
