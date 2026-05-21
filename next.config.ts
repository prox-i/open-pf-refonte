import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'open.pf',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  // WordPress legacy URL redirects — à compléter avec les URLs fournies par le bureau
  async redirects() {
    return [
      // { source: '/wp-content/:path*', destination: '/', permanent: true },
    ]
  },
}

export default nextConfig
