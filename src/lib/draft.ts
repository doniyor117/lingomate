import { readStored, writeStored } from './storage';

/**
 * What's in the input box, kept in storage so it survives the page being reloaded:
 * phones unload backgrounded apps, and a new deploy triggers a reload (VersionCheck).
 */
export interface Draft {
    sourceText: string;
    context: string;
    /** The history entry whose result is on screen for this text, if any. */
    entryId?: string;
}

const DRAFT_KEY = 'lumen_draft';

export function readDraft(): Draft | null {
    try {
        const draft = JSON.parse(readStored(DRAFT_KEY) || 'null');
        if (!draft || typeof draft.sourceText !== 'string' || typeof draft.context !== 'string') return null;
        return draft;
    } catch {
        return null;
    }
}

export function writeDraft(draft: Draft) {
    const empty = !draft.sourceText && !draft.context && !draft.entryId;
    writeStored(DRAFT_KEY, empty ? null : JSON.stringify(draft));
}
