import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  output: 'standalone',
  outputFileTracingExcludes: {
    '/*': ['backend/uploads/**/*', '.sites-migration/**/*'],
    '/api/*': ['backend/.env*', 'backend/uploads/**/*', '.sites-migration/**/*'],
    '/api/[[...path]]': ['backend/.env*', 'backend/uploads/**/*', '.sites-migration/**/*']
  },
  reactStrictMode: true,
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        react: path.join(rootDirectory, 'node_modules', 'react'),
        'react-dom': path.join(rootDirectory, 'node_modules', 'react-dom')
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*'
      }
    ];
  }
};

export default nextConfig;

initOpenNextCloudflareForDev();
