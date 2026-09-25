import { useMemo } from 'react';
import { TranslationEntry } from './types';
import { readStored, useStoredString, writeStored } from './storage';

export type { TranslationEntry };

const HISTORY_KEY = 'translation_history';
const MAX_HISTORY = 50;

function parseHistory(raw: string | null): TranslationEntry[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function getHistory(): TranslationEntry[] {
    return parseHistory(readStored(HISTORY_KEY));
}

/** Translation history that re-renders subscribers whenever it changes. */
export function useHistory(): TranslationEntry[] {
    const raw = useStoredString(HISTORY_KEY);
    return useMemo(() => parseHistory(raw), [raw]);
}

export function saveTranslation(entry: Omit<TranslationEntry, 'id' | 'timestamp'>): TranslationEntry {
    const newEntry: TranslationEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
    };

    // Add to beginning and limit to MAX_HISTORY
    const updated = [newEntry, ...getHistory()].slice(0, MAX_HISTORY);
    writeStored(HISTORY_KEY, JSON.stringify(updated));

    return newEntry;
}

export function deleteHistoryEntry(id: string): void {
    const filtered = getHistory().filter((entry) => entry.id !== id);
    writeStored(HISTORY_KEY, JSON.stringify(filtered));
}

export function clearHistory(): void {
    writeStored(HISTORY_KEY, null);
}

export function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}
