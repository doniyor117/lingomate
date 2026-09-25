import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { VersionCheck } from '@/components/VersionCheck';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], display: 'swap', variable: '--font-inter' });

// Applies the saved theme before first paint so the page doesn't flash light -> dark,
// and catches the one-time PWA install prompt before React loads (see lib/install.ts).
const themeScript = `addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__installPrompt=e});try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.classList.add(t)}catch(e){}`;

export const metadata: Metadata = {
    title: 'LumenAI Translate | Smart Multi-Meaning Translation',
    description: 'A powerful AI translator that provides context-aware translations with multiple meanings for vocabulary and accurate translations for sentences.',
    keywords: ['translator', 'AI', 'translation', 'language', 'vocabulary', 'multilingual'],
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'LumenAI',
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
                <meta name="mobile-web-app-capable" content="yes" />
            </head>
            <body>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
                <ServiceWorkerRegister />
                <VersionCheck />
            </body>
        </html>
    );
}
