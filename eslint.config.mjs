import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
    ...nextVitals,
    ...nextTs,
    // eslint-plugin-react's version auto-detection is broken on ESLint 10.
    { settings: { react: { version: '19' } } },
    globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/sw.js']),
]);
