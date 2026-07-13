import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const nextConfig = {
  output: 'standalone',
  outputFileTracingExcludes: {
    '/*': ['backend/uploads/**/*', '.sites-migration/**/*'],
    '/api/*': ['backend/.env*', 'backend/uploads/**/*', '.sites-migration/**/*'],
    '/api/[[...path]]': ['backend/.env*', 'backend/uploads/**/*', '.sites-migration/**/*']
  },
  reactStrictMode: true,
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
