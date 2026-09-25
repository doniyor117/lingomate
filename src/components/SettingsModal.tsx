import React, { useEffect } from 'react';
import { AUTO_MODEL, MODELS } from '@/lib/models';
import { ThemeToggle } from './ThemeToggle';
import { ModelSelect } from './ModelSelect';
import { APP_VERSION } from '@/lib/version';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    model: string;
    onModelChange: (val: string) => void;
}

export function SettingsModal({
    isOpen,
    onClose,
    model,
    onModelChange,
}: SettingsModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const modelOptions = [
        { id: AUTO_MODEL, displayName: 'Auto (Smart Selection)' },
        ...MODELS,
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4 sm:p-6">
            <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
                onClick={onClose}
                aria-hidden="true"
            />
            
            <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden animate-scale-in">
                <div className="flex-none flex items-center justify-between p-5 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-full transition-colors"
                        aria-label="Close settings"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <label className="text-sm font-medium text-[var(--foreground)]">Theme</label>
                            <p className="text-xs text-[var(--text-muted)]">Light, dark or match your device</p>
                        </div>
                        <ThemeToggle />
                    </div>

                    <div className="pt-5 border-t border-[var(--border)] space-y-1.5">
                        <label className="text-sm font-medium text-[var(--foreground)] block">Model</label>
                        <p className="text-xs text-[var(--text-muted)] mb-2">Used for all modes. If it fails, LumenAI switches to the other model for 15 minutes.</p>
                        <ModelSelect
                            value={model}
                            onChange={onModelChange}
                            options={modelOptions}
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-hover)] flex items-center justify-between gap-4">
                    <span className="text-xs text-[var(--text-muted)] font-mono">v{APP_VERSION}</span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
