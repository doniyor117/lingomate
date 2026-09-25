/** @type {import('next').NextConfig} */
const nextConfig = {
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
