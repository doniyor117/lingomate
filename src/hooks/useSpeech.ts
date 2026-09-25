import { useState, useEffect, useRef } from 'react';

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

// Prefers the higher-quality Google/Microsoft voices for a language when installed.
function speak(text: string, lang: string, onDone: () => void) {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices().filter((v) =>
        v.lang === lang || v.lang.replace('_', '-').startsWith(lang + '-')
    );
    const voice = voices.find((v) => v.name.includes('Google') || v.name.includes('Microsoft')) || voices[0];

    if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
    } else {
        utterance.lang = lang;
    }
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
    const [isSpeakingSource, setIsSpeakingSource] = useState(false);
    const [isSpeakingTarget, setIsSpeakingTarget] = useState(false);
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

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
            alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
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

    const handleSpeakSource = (text: string) => {
        if (!text.trim()) return;
        window.speechSynthesis.cancel();
        setIsSpeakingTarget(false);

        if (isSpeakingSource) {
            setIsSpeakingSource(false);
            return;
        }

        setIsSpeakingSource(true);
        speak(text, sourceSpeechLang, () => setIsSpeakingSource(false));
    };

    const handleSpeakTarget = () => {
        if (!targetSpeechText) return;
        window.speechSynthesis.cancel();
        setIsSpeakingSource(false);

        if (isSpeakingTarget) {
            setIsSpeakingTarget(false);
            return;
        }

        setIsSpeakingTarget(true);
        speak(targetSpeechText, targetLang, () => setIsSpeakingTarget(false));
    };

    return {
        isListening,
        isSpeakingSource,
        isSpeakingTarget,
        toggleListening,
        handleSpeakSource,
        handleSpeakTarget
    };
}
