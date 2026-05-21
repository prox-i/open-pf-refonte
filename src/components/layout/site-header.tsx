'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/reseau', label: 'Le réseau' },
  { href: '/adherents', label: 'Adhérents' },
  { href: '/actualites', label: 'Actualités' },
  { href: '/offres-emploi', label: "Offres d'emploi" },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const closeMenu = () => setIsOpen(false)

  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu principal
      </a>
      <header className="site-header" role="banner">
        <div className="header-inner container">
          <Link href="/" className="brand" aria-label="OPEN Polynésie française, accueil">
            <span className="open-logo-mark" aria-hidden="true" />
            <span>
              <span className="brand-word">OPEN</span>
              <span className="brand-sub">
                Organisation des Professionnels
                <br />
                de l&apos;Économie Numérique
              </span>
            </span>
          </Link>

          <button
            className="nav-toggle"
            type="button"
            aria-controls="navigation-principale"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setIsOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav
            id="navigation-principale"
            className={cn('primary-nav', isOpen && 'is-open')}
            aria-label="Navigation principale"
          >
            <ul>
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={
                      pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined
                    }
                    onClick={closeMenu}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            <Link href="/adhesion" className="btn">
              Adhérer{' '}
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M13.2 5.4 20 12l-6.8 6.6-1.4-1.5 4.1-4.1H4v-2h11.9l-4.1-4.1 1.4-1.5z"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}
