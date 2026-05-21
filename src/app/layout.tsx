import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const BASE_URL = 'https://open.pf'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | OPEN PF',
    default:
      'OPEN PF — Organisation des Professionnels de l’Économie Numérique de Polynésie française',
  },
  description:
    'Cluster de ~54 entreprises du numérique en Polynésie française, affilié au MEDEF PF.',
  openGraph: {
    siteName: 'OPEN PF',
    locale: 'fr_PF',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OPEN PF',
  alternateName: 'Organisation des Professionnels de l’Économie Numérique de Polynésie française',
  url: BASE_URL,
  logo: `${BASE_URL}/open-logo.svg`,
  description:
    'Cluster des professionnels du numérique en Polynésie française, fédérant ~54 entreprises.',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'PF',
    addressLocality: 'Papeete',
  },
  memberOf: {
    '@type': 'Organization',
    name: 'MEDEF Polynésie française',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
