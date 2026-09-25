import { NextRequest, NextResponse } from 'next/server';
import { translate } from '@/lib/translate-service';
import { getModelDisplayName } from '@/lib/models';
import { MAX_CHARS } from '@/lib/constants';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, sourceLang, targetLang, context, mode, model } = body;

        // Validation
        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        if (text.length > MAX_CHARS) {
            return NextResponse.json(
                { error: `Text exceeds maximum length of ${MAX_CHARS} characters` },
                { status: 400 }
            );
        }

        if (!targetLang) {
            return NextResponse.json(
                { error: 'Target language is required' },
                { status: 400 }
            );
        }

        if (mode && !['meaning', 'direct', 'reverse'].includes(mode)) {
            return NextResponse.json(
                { error: 'Invalid mode. Must be meaning, direct, or reverse' },
                { status: 400 }
            );
        }

        // Get API keys
        const groqApiKey = process.env.GROQ_API_KEY;
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!groqApiKey && !geminiApiKey) {
            return NextResponse.json(
                { error: 'No translation API keys (GROQ_API_KEY or GEMINI_API_KEY) are configured in .env.local' },
                { status: 500 }
            );
        }

        const result = await translate(
            {
                text: text.trim(),
                sourceLang: sourceLang || 'auto',
                targetLang,
                context,
                mode,
                model,
            },
            groqApiKey,
            geminiApiKey
        );

        return NextResponse.json({
            translation: result.translation,
            model: getModelDisplayName(result.model),
            mode: result.mode,
        });
    } catch (error) {
        console.error('Translation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Translation failed. Please try again.';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
