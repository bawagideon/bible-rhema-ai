/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // This tells Next.js to let Node.js handle this package natively
        // instead of trying to bundle it with Webpack.
        serverComponentsExternalPackages: ['@react-pdf/renderer'],
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false; // Prevent canvas errors
        return config;
    },
};

export default nextConfig;