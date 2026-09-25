import { execSync } from 'node:child_process';

// A unique id per build, baked into both the client bundle and the server, so an
// installed PWA running an old cached build can detect that a new one is live.
function buildVersion() {
    let sha = process.env.VERCEL_GIT_COMMIT_SHA || '';
    if (!sha) {
        try {
            sha = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
        } catch {
            sha = 'dev';
        }
    }
    return `${sha.slice(0, 7)}-${Date.now().toString(36)}`;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_APP_VERSION: buildVersion(),
        NEXT_PUBLIC_BUILD_TIME: String(Date.now()),
    },
    async headers() {
        return [
            {
                // The service worker must always be revalidated so updates roll out.
                source: '/sw.js',
                headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
            },
        ];
    },
};

export default nextConfig;
