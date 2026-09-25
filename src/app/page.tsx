'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { TranslatorPanel } from '@/components/TranslatorPanel';
import { HistorySidebar } from '@/components/HistorySidebar';
import { SettingsModal } from '@/components/SettingsModal';
import { TranslationEntry } from '@/lib/history';
import { usePreferences } from '@/hooks/usePreferences';
import { useInstallStatus } from '@/lib/install';

export default function Home() {
    const [historyOpen, setHistoryOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [restoredEntry, setRestoredEntry] = useState<TranslationEntry | null>(null);
    const prefs = usePreferences();
    const installStatus = useInstallStatus();
    const { applySettings, mode: currentMode } = prefs;

    // Restores the entry's result and the exact settings it was made with.
    const handleSelectHistory = useCallback((entry: TranslationEntry) => {
        setRestoredEntry(entry);
        applySettings({
            mode: entry.selectedMode ?? entry.mode ?? currentMode,
            sourceLang: entry.sourceLang,
            targetLang: entry.targetLang,
        });
        setHistoryOpen(false);
    }, [applySettings, currentMode]);

    return (
        <main className="min-h-screen flex flex-col relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="glow-wrapper">
                <div className="glow-circle glow-1" />
                <div className="glow-circle glow-2" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 py-4 bg-gradient-to-b from-[var(--background)] to-transparent pointer-events-none">
                <div className="flex items-center gap-3 pointer-events-auto">
                    <Image
                        src="/icon-192.png"
                        alt="LumenAI logo"
                        width={40}
                        height={40}
                        priority
                        className="w-10 h-10 rounded-xl shadow-lg shadow-blue-500/30"
                    />
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                            LumenAI
                        </h1>
                        <p className="text-xs text-[var(--text-muted)] hidden sm:block">
                            Smart translations with context
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors relative text-[var(--text-muted)] hover:text-[var(--foreground)]"
                        aria-label="Settings"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {installStatus === 'available' && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[var(--background)]" aria-label="App can be installed" />
                        )}
                    </button>

                    <button
                        onClick={() => setHistoryOpen(true)}
                        className="p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors relative text-[var(--text-muted)] hover:text-[var(--foreground)]"
                        aria-label="View history"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
                <TranslatorPanel
                    key={restoredEntry?.id ?? 'new'}
                    initialEntry={restoredEntry}
                    mode={prefs.mode}
                    onModeChange={prefs.setMode}
                    model={prefs.model}
                    sourceLang={prefs.sourceLang}
                    targetLang={prefs.targetLang}
                    onSourceLangChange={prefs.setSourceLang}
                    onTargetLangChange={prefs.setTargetLang}
                />
            </div>

            {/* History Sidebar */}
            <HistorySidebar
                isOpen={historyOpen}
                onClose={() => setHistoryOpen(false)}
                onSelect={handleSelectHistory}
            />

            <SettingsModal 
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                model={prefs.model}
                onModelChange={prefs.setModel}
            />

            <footer className="px-4 py-4 text-center text-xs text-[var(--text-muted)] tracking-wide bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none">
                <p className="pointer-events-auto">
                    LumenAI is AI and can make mistakes.
                </p>
            </footer>
        </main>
    );
}
