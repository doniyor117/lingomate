export interface Model {
    id: string;
    displayName: string;
}

export const MODELS: Model[] = [
    { id: 'gemini-3.5-flash-lite', displayName: 'Gemini 3.5 Flash-Lite' },
    { id: 'gemini-3.1-flash-lite', displayName: 'Gemini 3.1 Flash-Lite' },
];

export const AUTO_MODEL = 'auto';
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

export function isKnownModel(id: string): boolean {
    return MODELS.some((m) => m.id === id);
}

/** The concrete model a preference points to; "auto" means the default model. */
export function resolveModel(preference: string): string {
    return isKnownModel(preference) ? preference : DEFAULT_MODEL;
}

export function getModelDisplayName(id: string): string {
    return MODELS.find((m) => m.id === id)?.displayName ?? id;
}

/** The requested model first, then the others as fallbacks. */
export function getModelOrder(id?: string): string[] {
    const ids = MODELS.map((m) => m.id);
    if (!id || !isKnownModel(id)) return ids;
    return [id, ...ids.filter((m) => m !== id)];
}
