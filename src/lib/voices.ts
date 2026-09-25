import { useSyncExternalStore } from 'react';

/**
 * Read-aloud uses the browser's Web Speech API (speechSynthesis), which only has the
 * voices the device's browser/OS provides. Coverage varies a lot: Edge on desktop
 * ships online voices for Uzbek, while Chrome on Android and desktop has none. So
 * support is checked per language against the voices actually available.
 */

const EMPTY: SpeechSynthesisVoice[] = [];
let voices: SpeechSynthesisVoice[] = EMPTY;
const listeners = new Set<() => void>();
let listening = false;

function load() {
    const next = window.speechSynthesis.getVoices();
    if (next.length !== voices.length) {
        voices = next;
        listeners.forEach((l) => l());
    }
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    if (!listening && 'speechSynthesis' in window) {
        listening = true;
        // Chrome fills the list asynchronously and announces it with voiceschanged.
        window.speechSynthesis.addEventListener('voiceschanged', load);
        load();
    }
    return () => listeners.delete(listener);
}

function matchesLang(voice: SpeechSynthesisVoice, lang: string): boolean {
    const voiceLang = voice.lang.toLowerCase().replace('_', '-');
    const wanted = lang.toLowerCase();
    return voiceLang === wanted || voiceLang.startsWith(wanted + '-');
}

// The API has no gender field, so voices are recognized by their (well-known) names.
const MALE = /\b(male|david|mark|guy|ryan|christopher|eric|andrew|brian|roger|steffan|davis|tony|jason|daniel|alex|fred|tom|aaron|arthur|oliver|thomas|gordon|lee|rishi|dmitry|pavel|yuri|maxim|sardor|ahmet|conrad|killian|henri|jorge|diego|pablo|alvaro|luca|giorgio|xander|william|liam|james|george|reed|rocko|grandpa|eddy|jacques|stefan|hamed)\b/i;
const FEMALE = /\b(female|zira|hazel|susan|samantha|victoria|karen|moira|tessa|fiona|aria|jenny|emma|ava|michelle|sonia|libby|madina|svetlana|dariya|milena|katya|irina|anna|alice|amelie|helena|laura|sabina|elsa|paulina|monica|sara|kyoko|ting-ting|mei-jia|yuna|sandy|shelley|flo|grandma)\b/i;

function score(voice: SpeechSynthesisVoice): number {
    let s = 0;
    if (MALE.test(voice.name)) s += 4;
    if (FEMALE.test(voice.name)) s -= 4;
    // Neural/online voices sound much better than the older local ones.
    if (/natural|online|neural|google/i.test(voice.name)) s += 2;
    if (/microsoft/i.test(voice.name)) s += 1;
    return s;
}

/** Best voice for a language, preferring a male voice when one can be identified. */
export function pickVoice(lang: string): SpeechSynthesisVoice | null {
    const candidates = window.speechSynthesis.getVoices().filter((v) => matchesLang(v, lang));
    if (!candidates.length) return null;
    return candidates.reduce((best, v) => (score(v) > score(best) ? v : best));
}

/** Returns a function telling whether the device can read a language aloud. */
export function useCanSpeak(): (lang: string) => boolean {
    const available = useSyncExternalStore(subscribe, () => voices, () => EMPTY);
    return (lang: string) => available.some((v) => matchesLang(v, lang));
}
