'use client';

import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useStoredValue } from '@/lib/storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    setTheme: () => { },
});

const DARK_QUERY = '(prefers-color-scheme: dark)';
const isTheme = (v: string) => v === 'light' || v === 'dark' || v === 'system';

function applyTheme(theme: Theme) {
    const effective = theme === 'system'
        ? (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light')
        : theme;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(effective);
}

// The inline script in layout.tsx applies the saved theme before first paint;
// this provider only handles changes after that.
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, storeTheme] = useStoredValue<Theme>('theme', 'system', isTheme);

    const setTheme = useCallback((next: Theme) => {
        storeTheme(next);
        applyTheme(next);
    }, [storeTheme]);

    useEffect(() => {
        if (theme !== 'system') return;
        const mediaQuery = window.matchMedia(DARK_QUERY);
        const handleChange = () => applyTheme('system');
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
