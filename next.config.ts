import type { NextConfig } from 'next'

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' required by Next.js 15 for inline <style> tags (CSS-in-JS, theme vars)
  // and for JSON-LD <script type="application/ld+json"> blocks injected at render time.
  // A nonce-based CSP would eliminate this but requires Next.js custom server + middleware,
  // which adds significant operational complexity. Acceptable risk for this project.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // fonts.gstatic.com used by Google Fonts CSS import; next/font self-hosts at build time
  // but the fallback CSS reference is still served from Google. data: covers base64 fonts.
  "font-src 'self' data: https://fonts.gstatic.com",
  // blob: covers Next.js Image optimized URLs; Vercel Blob for member logos
  "img-src 'self' data: blob: https://open.pf https://www.open.pf https://*.public.blob.vercel-storage.com",
  // worker-src allows Next.js service worker in production builds
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'Content-Security-Policy', value: CSP },
]

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'open.pf',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  async redirects() {
    return [
      // --- Redirections 301 depuis les URL WordPress legacy (REC-004) ---
      // Source : page-sitemap.xml de open.pf. Préserve le SEO à la bascule.
      { source: '/qui-sommes-nous', destination: '/reseau', permanent: true },
      { source: '/nos-adherents', destination: '/adherents', permanent: true },
      { source: '/actualite', destination: '/actualites', permanent: true },
      { source: '/nos-offres-emploi', destination: '/offres-emploi', permanent: true },
      { source: '/rejoindre-le-mouvement', destination: '/adhesion', permanent: true },
      { source: '/mention', destination: '/mentions-legales', permanent: true },
      { source: '/politique-confidentialite', destination: '/confidentialite', permanent: true },
      // Pages legacy obsolètes → rabattues sur la rubrique actualités.
      { source: '/les-reunions-du-conseil-administration', destination: '/actualites', permanent: true },
      { source: '/les-tremplins-du-numerique-ateliers-rencontres', destination: '/actualites', permanent: true },
      { source: '/tremplins-du-numerique-infos', destination: '/actualites', permanent: true },
      { source: '/covid', destination: '/actualites', permanent: true },
      // Article « vœux 2025 » : slug WordPress non descriptif → slug propre (REC-008).
      // NB : le renommage effectif du slug en base de prod reste à faire via le back-office.
      { source: '/actualites/3528-2', destination: '/actualites/voeux-2025', permanent: true },
      { source: '/actualite/3528-2', destination: '/actualites/voeux-2025', permanent: true },
    ]
  },
}

export default nextConfig
