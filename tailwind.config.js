/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    // Phones keep :hover applied after a tap ("sticky hover"); only apply hover
    // styles on devices that can actually hover.
    future: {
        hoverOnlyWhenSupported: true,
    },
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // The theme accent (var(--primary)) as RGB channels, so opacity
                // modifiers like bg-accent/10 work; bg-[var(--primary)]/10 can't.
                accent: 'rgb(var(--primary-rgb) / <alpha-value>)',
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
