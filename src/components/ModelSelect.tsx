import React, { useState, useRef, useEffect } from 'react';

interface ModelOption {
    id: string;
    displayName: string;
}

interface ModelSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: ModelOption[];
}

export function ModelSelect({ value, onChange, options }: ModelSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedName = (options.find((o) => o.id === value) ?? options[0]).displayName;

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none transition-shadow flex items-center justify-between text-left group"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="truncate text-[var(--foreground)] pr-4">{selectedName}</span>
                <svg className={`w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div role="listbox" className="w-full mt-1 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl max-h-60 overflow-y-auto animate-scale-in origin-top">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            role="option"
                            aria-selected={value === option.id}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${value === option.id ? 'bg-accent/10 text-[var(--primary)] font-medium' : 'text-[var(--foreground)] hover:bg-[var(--surface-hover)]'}`}
                            onClick={() => {
                                onChange(option.id);
                                setIsOpen(false);
                            }}
                        >
                            {option.displayName}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
