import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // the shared kit ships TypeScript sources
  transpilePackages: ['@repo/ui', '@repo/shared'],
  output: 'standalone',
  // the app lives in a pnpm workspace, so tracing has to start at the monorepo root
  outputFileTracingRoot: path.join(directory, '../..'),
  async redirects() {
    // the wiki moved from /docs/wiki/* to the domain root, the editor went inside the article
    return [
      { source: '/docs/wiki/:path*', destination: '/:path*', permanent: true },
      { source: '/docs/wiki', destination: '/', permanent: true },
      { source: '/docs', destination: '/', permanent: true },
      { source: '/docs/:path*', destination: '/:path*', permanent: true },
      { source: '/edit/:path*', destination: '/:path*', permanent: true },
      { source: '/edit', destination: '/', permanent: true },
    ];
  },
};

export default config;
