'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface NavItem {
  href: string
  label: string
  badge?: number
}

interface AdminSidebarProps {
  userName: string
  pendingCount: number
  pendingFichesCount: number
}

export function AdminSidebar({ userName, pendingCount, pendingFichesCount }: AdminSidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { href: '/admin', label: "Vue d'ensemble" },
    { href: '/admin/demandes', label: "Demandes d'adhésion", badge: pendingCount },
    { href: '/admin/adherents', label: 'Adhérents' },
    { href: '/admin/fiches', label: 'Fiches à valider', badge: pendingFichesCount },
    { href: '/admin/actualites', label: 'Actualités' },
    { href: '/admin/offres-emploi', label: "Offres d'emploi" },
    { href: '/admin/relances', label: 'Relances' },
    { href: '/admin/contenu', label: 'Contenu du site' },
    { href: '/admin/reglages', label: 'Réglages' },
  ]

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="admin-sidebar">
      <Link href="/" className="brand admin-brand" aria-label="OPEN Polynésie française, accueil">
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

      <nav className="admin-nav" aria-label="Administration">
        <ul className="admin-menu">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={isActive(item.href) ? 'active' : ''}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="badge">{item.badge}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="admin-sidebar-footer">
        <span className="admin-user">{userName}</span>
        <button
          type="button"
          className="btn-signout"
          onClick={() => signOut({ redirectTo: '/admin/login' })}
        >
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
