export const MAX_CHARS = 10000;

import type { MessageKey } from './i18n';

// Labels are translated; values are sent to the model as-is.
export const CONTEXT_PRESETS: { label: MessageKey; value: string }[] = [
    { label: 'preset.formal', value: 'formal tone' },
    { label: 'preset.casual', value: 'casual tone' },
    { label: 'preset.slang', value: 'slang and idioms' },
    { label: 'preset.technical', value: 'technical / professional' },
];
