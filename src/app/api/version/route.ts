import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/version';

export const dynamic = 'force-dynamic';

export function GET() {
    return NextResponse.json(
        { version: APP_VERSION },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}
