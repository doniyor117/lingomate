import { useState, useEffect, useRef } from 'react';
import { pickVoice } from '@/lib/voices';
import { useI18n } from '@/lib/i18n';

// Minimal typing for the non-standard webkitSpeechRecognition API.
interface SpeechRecognitionLike {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface UseSpeechParams {
    /** Source language as selected; may be "auto". */
    sourceLang: string;
    /** Language to read the source text in (detected language when source is auto). */
    sourceSpeechLang: string;
    targetLang: string;
    setSourceText: (text: string) => void;
    /** What "Listen" reads for the result, already reduced to target-language words. */
    targetSpeechText: string;
}

function speak(text: string, voice: SpeechSynthesisVoice, onDone: () => void) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.onend = onDone;
    utterance.onerror = onDone;
    window.speechSynthesis.speak(utterance);
}

export function useSpeech({
    sourceLang,
    sourceSpeechLang,
    targetLang,
    setSourceText,
    targetSpeechText
}: UseSpeechParams) {
    const [isListening, setIsListening] = useState(false);
    // Which item is being read aloud ('source', 'target', or a result item's key).
    const [speakingKey, setSpeakingKey] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const { t } = useI18n();

    // Ensure speech stops on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Created on first use rather than on page load; most sessions never touch the mic.
    const getRecognition = () => {
        if (recognitionRef.current) return recognitionRef.current;
        if (!('webkitSpeechRecognition' in window)) return null;

        const SpeechRecognition = (window as unknown as { webkitSpeechRecognition: SpeechRecognitionCtor }).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setSourceText(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        return recognition;
    };

    const toggleListening = () => {
        const recognition = getRecognition();
        if (!recognition) {
            alert(t('speech.unsupported'));
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            if (sourceLang !== 'auto') {
                recognition.lang = sourceLang;
            }
            recognition.start();
            setIsListening(true);
        }
    };

    /** Reads `text` aloud, or stops it if that item is already playing. */
    const speakItem = (key: string, text: string, lang: string) => {
        window.speechSynthesis.cancel();
        // No voice for this language on this device: reading it with another
        // language's voice would be gibberish, so don't read at all.
        const voice = pickVoice(lang);
        if (speakingKey === key || !text.trim() || !voice) {
            setSpeakingKey(null);
            return;
        }
        setSpeakingKey(key);
        speak(text, voice, () => setSpeakingKey((current) => (current === key ? null : current)));
    };

    const handleSpeakSource = (text: string) => speakItem('source', text, sourceSpeechLang);
    const handleSpeakTarget = () => speakItem('target', targetSpeechText, targetLang);

    return {
        isListening,
        isSpeakingSource: speakingKey === 'source',
        isSpeakingTarget: speakingKey === 'target',
        speakingKey,
        speakItem,
        toggleListening,
        handleSpeakSource,
        handleSpeakTarget
    };
}
