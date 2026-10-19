/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // This tells Next.js to let Node.js handle this package natively
        // instead of trying to bundle it with Webpack.
        serverComponentsExternalPackages: ['@react-pdf/renderer', 'jsdom'],
    },
    webpack: (config, { isServer }) => {
        config.resolve.alias.canvas = false; // Prevent canvas errors
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                jsdom: false,
            };
        }
        return config;
    },
};

export default nextConfig;