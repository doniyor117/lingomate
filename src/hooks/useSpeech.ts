import { useState, useEffect, useRef } from 'react';
import { languages } from '@/lib/languages';

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
    sourceLang: string;
    targetLang: string;
    setSourceText: (text: string) => void;
    translatedText: string;
    outputMode: string;
}

export function useSpeech({
    sourceLang,
    targetLang,
    setSourceText,
    translatedText,
    outputMode
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

    const parseDetectedLangCode = (text: string): string => {
        if (!text) return 'en';
        const match = text.match(/Detected Language:\s*([A-Za-z\s]+)(?:[\uD83C-\uDBFF\uDC00-\uDFFF\u2000-\u32FF])?/i);
        if (match && match[1]) {
            const langName = match[1].trim();
            const found = languages.find(l => l.name.toLowerCase() === langName.toLowerCase());
            if (found) return found.code;
        }
        return 'en';
    };

    const handleSpeakSource = (text: string) => {
        if (!text.trim()) return;

        window.speechSynthesis.cancel();

        if (isSpeakingSource) {
            setIsSpeakingSource(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        let resolvedLang = sourceLang;
        if (resolvedLang === 'auto' && translatedText) {
            resolvedLang = parseDetectedLangCode(translatedText);
        }
        if (resolvedLang === 'auto') {
            resolvedLang = 'en';
        }

        const freshVoices = window.speechSynthesis.getVoices();
        const matchingVoices = freshVoices.filter(v =>
            v.lang === resolvedLang ||
            v.lang.replace('_', '-').startsWith(resolvedLang + '-')
        );

        const selectedVoice = matchingVoices.find(v =>
            v.name.includes('Google') || v.name.includes('Microsoft')
        ) || matchingVoices[0] || null;

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        } else {
            utterance.lang = resolvedLang;
        }

        utterance.onend = () => setIsSpeakingSource(false);
        utterance.onerror = () => setIsSpeakingSource(false);

        setIsSpeakingSource(true);
        window.speechSynthesis.speak(utterance);
    };

    const handleSpeakTarget = () => {
        if (!translatedText) return;

        window.speechSynthesis.cancel();

        if (isSpeakingTarget) {
            setIsSpeakingTarget(false);
            return;
        }

        let textToRead = translatedText;

        // Clean up markdown for meaning/reverse modes
        if (outputMode !== 'direct') {
            const lines = translatedText.split('\n');
            const translationWords: string[] = [];
            for (const line of lines) {
                // Find lines starting with a number, then optional emojis/bold markdown
                const match = line.match(/^\d+\.\s*(?:[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])?\s*\*\*?([^\*]+)\*\*?/);
                if (match && match[1]) {
                    translationWords.push(match[1].trim());
                }
            }
            if (translationWords.length > 0) {
                textToRead = translationWords.join(', ');
            } else {
                const nonEmptyLines = lines.filter(l => l.trim() && !l.startsWith('**Detected Language'));
                if (nonEmptyLines.length > 1) {
                    textToRead = nonEmptyLines.slice(1).join('. ').replace(/\*/g, '');
                }
            }
        } else {
            const lines = translatedText.split('\n');
            const translationLines = lines.filter(l => !l.startsWith('**Detected Language'));
            textToRead = translationLines.join('\n').replace(/\*/g, '').trim();
        }

        const utterance = new SpeechSynthesisUtterance(textToRead);
        const freshVoices = window.speechSynthesis.getVoices();

        const matchingVoices = freshVoices.filter(v =>
            v.lang === targetLang ||
            v.lang.replace('_', '-').startsWith(targetLang + '-')
        );

        const selectedVoice = matchingVoices.find(v =>
            v.name.includes('Google') || v.name.includes('Microsoft')
        ) || matchingVoices[0] || null;

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        } else {
            utterance.lang = targetLang;
        }

        utterance.onend = () => setIsSpeakingTarget(false);
        utterance.onerror = () => setIsSpeakingTarget(false);

        setIsSpeakingTarget(true);
        window.speechSynthesis.speak(utterance);
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
